import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { Badge } from '../models/badge.model';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

async function seedBadges() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const badgeModel = app.get<Model<Badge>>(getModelToken(Badge.name));

  const badges = [
    {
      name: 'Người học kiên trì',
      description: 'Hoàn thành khóa học đầu tiên',
      icon: '🎓',
      color: '#4CAF50',
      criteria: {
        kind: 'course_completion',
        requiredScore: 100,
      },
      isActive: true,
    },
    {
      name: 'Học sinh xuất sắc',
      description: 'Đạt điểm tuyệt đối trong bài kiểm tra',
      icon: '⭐',
      color: '#FFD700',
      criteria: {
        kind: 'quiz_perfect',
        requiredScore: 100,
      },
      isActive: true,
    },
    {
      name: 'Người học chăm chỉ',
      description: 'Học liên tục 7 ngày',
      icon: '🔥',
      color: '#FF5722',
      criteria: {
        kind: 'streak',
        requiredStreak: 7,
      },
      isActive: true,
    },
    {
      name: 'Chuyên gia Toán học',
      description: 'Hoàn thành khóa học Toán học',
      icon: '📐',
      color: '#2196F3',
      criteria: {
        kind: 'course_completion',
        customCondition: 'course_category:math',
      },
      isActive: true,
    },
    {
      name: 'Nhà văn tài ba',
      description: 'Hoàn thành khóa học Tiếng Việt',
      icon: '📝',
      color: '#9C27B0',
      criteria: {
        kind: 'course_completion',
        customCondition: 'course_category:vietnamese',
      },
      isActive: true,
    },
    {
      name: 'Nhà khoa học nhí',
      description: 'Hoàn thành khóa học Khoa học',
      icon: '🔬',
      color: '#FF9800',
      criteria: {
        kind: 'course_completion',
        customCondition: 'course_category:science',
      },
      isActive: true,
    },
    {
      name: 'Lập trình viên tương lai',
      description: 'Hoàn thành khóa học Tin học',
      icon: '💻',
      color: '#607D8B',
      criteria: {
        kind: 'course_completion',
        customCondition: 'course_category:computer',
      },
      isActive: true,
    },
    {
      name: 'Nghệ sĩ tài năng',
      description: 'Hoàn thành khóa học Mỹ thuật',
      icon: '🎨',
      color: '#E91E63',
      criteria: {
        kind: 'course_completion',
        customCondition: 'course_category:art',
      },
      isActive: true,
    },
    {
      name: 'Ca sĩ nhí',
      description: 'Hoàn thành khóa học Âm nhạc',
      icon: '🎵',
      color: '#3F51B5',
      criteria: {
        kind: 'course_completion',
        customCondition: 'course_category:music',
      },
      isActive: true,
    },
    {
      name: 'Học sinh toàn diện',
      description: 'Hoàn thành 5 khóa học khác nhau',
      icon: '🏆',
      color: '#795548',
      criteria: {
        kind: 'custom',
        customCondition: 'completed_courses:5',
      },
      isActive: true,
    },
  ];

  try {
    // Clear existing badges
    await badgeModel.deleteMany({});
    console.log('Cleared existing badges');

    // Insert new badges
    await badgeModel.insertMany(badges);
    console.log(`Successfully seeded ${badges.length} badges`);

    // Display seeded badges
    const seededBadges = await badgeModel.find({});
    console.log('\nSeeded badges:');
    seededBadges.forEach((badge, index) => {
      console.log(`${index + 1}. ${badge.name} - ${badge.description}`);
    });

  } catch (error) {
    console.error('Error seeding badges:', error);
  } finally {
    await app.close();
  }
}

seedBadges();
