import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.model';
import { Course, CourseDocument } from '../models/course.model';
import { Classroom, ClassroomDocument } from '../models/classroom.model';
import { Lesson, LessonDocument } from '../models/lesson.model';
import { Assignment, AssignmentDocument } from '../models/assignment.model';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

interface SeedData {
  users: Array<{
    email: string;
    name: string;
    role: string;
    password: string;
  }>;
  courses: Array<{
    title: string;
    slug: string;
    description: string;
    createdBy: string; // email of teacher
    category?: string;
    level?: string;
    visibility?: 'public' | 'private';
    status?: 'draft' | 'published' | 'archived';
  }>;
  classes: Array<{
    title: string;
    courseSlug: string;
    teacherEmails: string[];
    inviteCode: string;
  }>;
}

async function seed() {
  console.log('🌱 Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
  const classroomModel = app.get<Model<ClassroomDocument>>(getModelToken(Classroom.name));
  const lessonModel = app.get<Model<LessonDocument>>(getModelToken(Lesson.name));
  const assignmentModel = app.get<Model<AssignmentDocument>>(getModelToken(Assignment.name));

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await userModel.deleteMany({});
    await courseModel.deleteMany({});
    await classroomModel.deleteMany({});
    await lessonModel.deleteMany({});
    await assignmentModel.deleteMany({});

    // Load seed data
    const seedDataPath = path.join(__dirname, '../../../../seed/sample_data.json');
    const seedData: SeedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

    // Create users
    console.log('👥 Creating users...');
    const userMap = new Map<string, string>();
    
    for (const userData of seedData.users) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = new userModel({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        passwordHash,
        verified: true,
      });
      await user.save();
      userMap.set(userData.email, (user._id as any).toString());
      console.log(`✅ Created user: ${userData.name} (${userData.email})`);
    }

    // Create courses (primary-school compliant)
    console.log('📚 Creating courses...');
    const courseMap = new Map<string, string>();
    
    for (const courseData of seedData.courses) {
      const createdBy = userMap.get(courseData.createdBy);
      if (!createdBy) {
        console.error(`❌ User not found: ${courseData.createdBy}`);
        continue;
      }
      const category = courseData.category && ['Toán','Tiếng Việt','Tiếng Anh','Khoa học','Tin học','Mỹ thuật','Âm nhạc'].includes(courseData.category)
        ? courseData.category : 'Toán';
      const level = courseData.level && ['Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5'].includes(courseData.level)
        ? courseData.level : 'Lớp 1';
      const visibility = (courseData.visibility === 'private') ? 'private' : 'public';
      const status = (courseData.status && ['draft','published','archived'].includes(courseData.status)) ? courseData.status : 'published';

      const course = new courseModel({
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        createdBy,
        category,
        level,
        visibility,
        status,
        tags: [category.toLowerCase(), level.toLowerCase()],
      });
      await course.save();
      courseMap.set(courseData.slug, (course._id as any).toString());
      console.log(`✅ Created course: ${courseData.title}`);
    }

    // Create classrooms
    console.log('🏫 Creating classrooms...');
    const classroomMap = new Map<string, string>();
    
    for (const classData of seedData.classes) {
      const courseId = courseMap.get(classData.courseSlug);
      if (!courseId) {
        console.error(`❌ Course not found: ${classData.courseSlug}`);
        continue;
      }

      const teacherIds = classData.teacherEmails
        .map(email => userMap.get(email))
        .filter(id => id) as string[];

      if (teacherIds.length === 0) {
        console.error(`❌ No valid teachers found for class: ${classData.title}`);
        continue;
      }

      const classroom = new classroomModel({
        title: classData.title,
        courseId,
        teacherIds,
        studentIds: [],
        inviteCode: classData.inviteCode,
        schedule: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
      await classroom.save();
      classroomMap.set(classData.title, (classroom._id as any).toString());
      console.log(`✅ Created classroom: ${classData.title}`);
    }

    // Create sample lessons
    console.log('📖 Creating lessons...');
    const classroomIds = Array.from(classroomMap.values());
    
    for (const classroomId of classroomIds) {
      const classroom = await classroomModel.findById(classroomId);
      if (!classroom) continue;

      const teacherId = classroom.teacherIds[0];
      if (!teacherId) continue;

      const lessons = [
        {
          title: 'Bài 1: Học chữ cái A',
          contentHtml: '<h2>Chữ cái A</h2><p>Hôm nay chúng ta sẽ học chữ cái A. Chữ A có hình dạng như một ngôi nhà.</p>',
          order: 1,
        },
        {
          title: 'Bài 2: Học chữ cái B',
          contentHtml: '<h2>Chữ cái B</h2><p>Chữ B có hai vòng tròn xếp chồng lên nhau.</p>',
          order: 2,
        },
        {
          title: 'Bài 3: Học chữ cái C',
          contentHtml: '<h2>Chữ cái C</h2><p>Chữ C giống như một cái bánh rán bị cắt một miếng.</p>',
          order: 3,
        },
      ];

      for (const lessonData of lessons) {
        const lesson = new lessonModel({
          ...lessonData,
          classroomId,
          createdBy: teacherId,
        });
        await lesson.save();
        console.log(`✅ Created lesson: ${lessonData.title}`);
      }
    }

    // Create sample assignments
    console.log('📝 Creating assignments...');
    
    for (const classroomId of classroomIds) {
      const classroom = await classroomModel.findById(classroomId);
      if (!classroom) continue;

      const teacherId = classroom.teacherIds[0];
      if (!teacherId) continue;

      const assignments = [
        {
          title: 'Bài tập viết chữ A',
          description: 'Viết 5 lần chữ A vào vở tập viết',
          totalPoints: 100,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
        {
          title: 'Bài tập đọc từ có chữ A',
          description: 'Đọc to 10 từ có chữ A và ghi âm lại',
          totalPoints: 100,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
      ];

      for (const assignmentData of assignments) {
        const assignment = new assignmentModel({
          ...assignmentData,
          classroomId,
          createdBy: teacherId,
        });
        await assignment.save();
        console.log(`✅ Created assignment: ${assignmentData.title}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${seedData.users.length}`);
    console.log(`- Courses: ${seedData.courses.length}`);
    console.log(`- Classrooms: ${seedData.classes.length}`);
    console.log(`- Lessons: ${classroomIds.length * 3}`);
    console.log(`- Assignments: ${classroomIds.length * 2}`);
    
    console.log('\n🔑 Test accounts:');
    for (const user of seedData.users) {
      console.log(`- ${user.name} (${user.email}) - Password: ${user.password}`);
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();
