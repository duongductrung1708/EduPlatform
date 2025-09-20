import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.model';
import { Course, CourseDocument } from '../models/course.model';
import { CourseEnrollment, CourseEnrollmentDocument } from '../models/course-enrollment.model';

async function createEnrollmentData() {
  console.log('🎓 Creating enrollment data...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const courseModel = app.get<Model<CourseDocument>>(getModelToken(Course.name));
  const enrollmentModel = app.get<Model<CourseEnrollmentDocument>>(getModelToken(CourseEnrollment.name));

  try {
    // Find a student user
    const student = await userModel.findOne({ role: 'student' });
    if (!student) {
      console.log('❌ No student found. Please create a student user first.');
      return;
    }
    console.log('✅ Found student:', student.email);

    // Find all published courses
    const courses = await courseModel.find({ status: 'published' });
    console.log('✅ Found courses:', courses.length);

    if (courses.length === 0) {
      console.log('❌ No published courses found. Please create courses first.');
      return;
    }

    // Create enrollments for the student in some courses
    const enrollmentsToCreate = Math.min(3, courses.length); // Enroll in up to 3 courses
    
    for (let i = 0; i < enrollmentsToCreate; i++) {
      const course = courses[i];
      
      // Check if already enrolled
      const existingEnrollment = await enrollmentModel.findOne({
        studentId: student._id,
        courseId: course._id
      });

      if (existingEnrollment) {
        console.log(`⏭️  Student already enrolled in: ${course.title}`);
        continue;
      }

      // Create enrollment
      const enrollment = new enrollmentModel({
        studentId: student._id,
        courseId: course._id,
        progress: {
          completedLessons: [],
          completedModules: [],
          totalLessons: 0,
          totalModules: 0,
          percentage: 0
        },
        isActive: true
      });

      await enrollment.save();
      console.log(`✅ Enrolled student in: ${course.title}`);

      // Update course enrollment count
      await courseModel.findByIdAndUpdate(course._id, { 
        $inc: { enrollmentCount: 1 } 
      });
    }

    console.log('🎉 Enrollment data created successfully!');
    console.log('📊 Summary:');
    console.log(`- Student: ${student.email}`);
    console.log(`- Enrolled in: ${enrollmentsToCreate} courses`);

  } catch (error) {
    console.error('❌ Error creating enrollment data:', error);
  } finally {
    await app.close();
  }
}

createEnrollmentData();
