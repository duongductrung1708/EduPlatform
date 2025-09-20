import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.model';
import { Course, CourseDocument } from '../models/course.model';

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

async function seedPublicCourses() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));

  try {
    // find all teachers in the database
    const teachers = await userModel.find({ role: 'teacher' });
    console.log(`Found ${teachers.length} teachers in database`);
    
    if (teachers.length === 0) {
      console.log('No teachers found, creating a default teacher...');
      const defaultTeacher = await userModel.create({
        email: 'autoteacher@example.com',
        name: 'Giáo viên Tự động',
        role: 'teacher',
        passwordHash: '$2b$10$E7o9kYx0Xw2J2m8vQw0uM.4h6v0bQ0a3G1Yj7lJt0J6m7gUeQm4tK', // 'password123' pre-hash optional
        verified: true,
      });
      teachers.push(defaultTeacher);
    }

    const candidates = [
      { title: 'Toán Lớp 1 - Hình học vui', category: 'Toán', level: 'Lớp 1' },
      { title: 'Toán Lớp 2 - Phép cộng trừ nâng cao', category: 'Toán', level: 'Lớp 2' },
      { title: 'Tiếng Việt Lớp 3 - Kể chuyện sáng tạo', category: 'Tiếng Việt', level: 'Lớp 3' },
      { title: 'Tiếng Anh Lớp 4 - Giao tiếp hàng ngày', category: 'Tiếng Anh', level: 'Lớp 4' },
      { title: 'Khoa học Lớp 5 - Vũ trụ và Hành tinh', category: 'Khoa học', level: 'Lớp 5' },
      { title: 'Tin học Lớp 3 - Lập trình Scratch nâng cao', category: 'Tin học', level: 'Lớp 3' },
      { title: 'Mỹ thuật Lớp 4 - Màu sắc và Cảm xúc', category: 'Mỹ thuật', level: 'Lớp 4' },
      { title: 'Âm nhạc Lớp 5 - Hòa âm cơ bản', category: 'Âm nhạc', level: 'Lớp 5' },
      { title: 'Toán Lớp 3 - Ứng dụng thực tế', category: 'Toán', level: 'Lớp 3' },
      { title: 'Tiếng Việt Lớp 1 - Vần và Âm', category: 'Tiếng Việt', level: 'Lớp 1' },
      { title: 'Khoa học Lớp 2 - Thế giới động vật', category: 'Khoa học', level: 'Lớp 2' },
      { title: 'Tin học Lớp 4 - Internet an toàn', category: 'Tin học', level: 'Lớp 4' },
    ];

    let createdCount = 0;

    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i];
      const category = (PRIMARY_CATEGORIES as readonly string[]).includes(item.category) ? item.category : 'Toán';
      const level = (PRIMARY_LEVELS as readonly string[]).includes(item.level) ? item.level : 'Lớp 1';
      const slug = slugify(item.title) || 'khoa-hoc';
      const exists = await courseModel.findOne({ slug });
      if (exists) continue;
      
      // Assign course to a teacher (distribute evenly among available teachers)
      const assignedTeacher = teachers[i % teachers.length];
      
      await courseModel.create({
        title: item.title,
        slug,
        description: `Mô tả cho khóa học ${item.title}`,
        category,
        level,
        createdBy: assignedTeacher._id,
        status: 'published',
        visibility: 'public',
        tags: [category.toLowerCase(), level.toLowerCase()],
      });
      
      console.log(`Created course "${item.title}" assigned to teacher "${assignedTeacher.name}"`);
      createdCount++;
    }

    console.log(`✅ Seeded ${createdCount} public courses`);
  } catch (err) {
    console.error('❌ Error seeding public courses:', err);
  } finally {
    await app.close();
  }
}

seedPublicCourses();


