import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.model';
import { Course, CourseDocument } from '../models/course.model';
import { Classroom, ClassroomDocument } from '../models/classroom.model';
import * as bcrypt from 'bcrypt';

const PRIMARY_CATEGORIES = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Tin học', 'Mỹ thuật', 'Âm nhạc'] as const;
const PRIMARY_LEVELS = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'] as const;

function slugify(input: string) {
  return (input || '')
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function createSampleData() {
  console.log('🌱 Creating sample data...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
  const classroomModel = app.get<Model<ClassroomDocument>>(getModelToken(Classroom.name));

  try {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('password123', 10);
    const admin = new userModel({
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      passwordHash: adminPasswordHash,
      verified: true,
    });
    await admin.save();
    console.log('✅ Created admin user');

    // Create teacher users
    const teacherPasswordHash = await bcrypt.hash('password123', 10);
    const teacher1 = new userModel({
      email: 'teacher1@example.com',
      name: 'Nguyễn Văn A',
      role: 'teacher',
      passwordHash: teacherPasswordHash,
      verified: true,
    });
    await teacher1.save();
    console.log('✅ Created teacher1');

    const teacher2 = new userModel({
      email: 'teacher2@example.com',
      name: 'Trần Thị B',
      role: 'teacher',
      passwordHash: teacherPasswordHash,
      verified: true,
    });
    await teacher2.save();
    console.log('✅ Created teacher2');

    // Create student users
    const studentPasswordHash = await bcrypt.hash('password123', 10);
    const students = [];
    for (let i = 1; i <= 20; i++) {
      const student = new userModel({
        email: `student${i}@example.com`,
        name: `Học sinh ${i}`,
        role: 'student',
        passwordHash: studentPasswordHash,
        verified: true,
      });
      await student.save();
      students.push(student);
    }
    console.log('✅ Created 20 students');

    // Create parent users
    const parentPasswordHash = await bcrypt.hash('password123', 10);
    for (let i = 1; i <= 10; i++) {
      const parent = new userModel({
        email: `parent${i}@example.com`,
        name: `Phụ huynh ${i}`,
        role: 'parent',
        passwordHash: parentPasswordHash,
        verified: true,
      });
      await parent.save();
    }
    console.log('✅ Created 10 parents');

    // Create courses
    const courses: CourseDocument[] = [];
    const courseData = [
      { title: 'Toán Lớp 1 - Số và Phép tính', category: 'Toán', level: 'Lớp 1' },
      { title: 'Tiếng Việt Lớp 2 - Chính tả và Tập đọc', category: 'Tiếng Việt', level: 'Lớp 2' },
      { title: 'Tiếng Anh Lớp 3 - Từ vựng cơ bản', category: 'Tiếng Anh', level: 'Lớp 3' },
      { title: 'Khoa học Lớp 4 - Cơ thể người', category: 'Khoa học', level: 'Lớp 4' },
      { title: 'Tin học Lớp 5 - Làm quen Scratch', category: 'Tin học', level: 'Lớp 5' },
      { title: 'Mỹ thuật Lớp 1 - Hình khối cơ bản', category: 'Mỹ thuật', level: 'Lớp 1' },
      { title: 'Âm nhạc Lớp 2 - Nhịp điệu và giai điệu', category: 'Âm nhạc', level: 'Lớp 2' },
      { title: 'Toán Lớp 3 - Bảng cửu chương', category: 'Toán', level: 'Lớp 3' },
    ];

    // ensure unique slug helper
    const ensureUniqueSlug = async (base: string) => {
      let unique = base;
      let i = 1;
      while (await courseModel.exists({ slug: unique })) {
        unique = `${base}-${i++}`;
      }
      return unique;
    };

    for (const courseInfo of courseData) {
      // validate to allowed sets
      const category = (PRIMARY_CATEGORIES as readonly string[]).includes(courseInfo.category) ? courseInfo.category : 'Toán';
      const level = (PRIMARY_LEVELS as readonly string[]).includes(courseInfo.level) ? courseInfo.level : 'Lớp 1';
      const baseSlug = slugify(courseInfo.title);
      const slug = await ensureUniqueSlug(baseSlug || 'khoa-hoc');

      const course = new courseModel({
        title: courseInfo.title,
        slug,
        description: `Mô tả cho khóa học ${courseInfo.title}`,
        category,
        level,
        createdBy: teacher1._id,
        status: 'published',
        visibility: 'public',
        tags: [category.toLowerCase(), level.toLowerCase()],
      });
      await course.save();
      courses.push(course);
    }
    console.log('✅ Created 8 primary-school courses');

    // Create classrooms
    for (let i = 0; i < 5; i++) {
      const course = courses[i];
      const classroomStudents = students.slice(i * 4, (i + 1) * 4);
      
      const classroom = new classroomModel({
        name: `Lớp ${course.title} - ${i + 1}`,
        description: `Lớp học ${course.title}`,
        courseId: course._id,
        teacherId: i % 2 === 0 ? teacher1._id : teacher2._id,
        students: classroomStudents.map(s => s._id),
        maxStudents: 30,
        status: 'active',
        inviteCode: `INVITE${i + 1}`,
        schedule: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
      await classroom.save();
    }
    console.log('✅ Created 5 classrooms');

    console.log('🎉 Sample data created successfully!');
    console.log('📊 Summary:');
    console.log(`- Users: ${await userModel.countDocuments()}`);
    console.log(`- Courses: ${await courseModel.countDocuments()}`);
    console.log(`- Classrooms: ${await classroomModel.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await app.close();
  }
}

createSampleData();
