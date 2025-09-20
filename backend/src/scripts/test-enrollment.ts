import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.model';
import { Course, CourseDocument } from '../models/course.model';
import { CourseEnrollment, CourseEnrollmentDocument } from '../models/course-enrollment.model';

async function testEnrollment() {
  console.log('🧪 Testing enrollment...');

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

    // Check existing enrollments
    const existingEnrollments = await enrollmentModel.find({
      studentId: student._id,
      isActive: true
    }).populate('courseId');

    console.log('📚 Existing enrollments:', existingEnrollments.length);
    existingEnrollments.forEach(enrollment => {
      console.log(`  - ${(enrollment.courseId as any)?.title || 'Unknown Course'}`);
    });

    // Create a new enrollment if none exist
    if (existingEnrollments.length === 0) {
      const course = courses[0];
      console.log(`🎓 Creating enrollment for: ${course.title}`);
      
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
      console.log('✅ Enrollment created successfully!');

      // Update course enrollment count
      await courseModel.findByIdAndUpdate(course._id, { 
        $inc: { enrollmentCount: 1 } 
      });
    }

    // Test the getMyEnrolled endpoint
    console.log('\n🔍 Testing getMyEnrolled logic...');
    const testEnrollments = await enrollmentModel
      .find({ 
        studentId: student._id,
        isActive: true 
      })
      .populate('courseId')
      .lean();

    console.log('Found enrollments:', testEnrollments.length);
    
    const testCourses = testEnrollments
      .map(enrollment => enrollment.courseId)
      .filter(course => course && (course as any).status === 'published');

    console.log('Filtered published courses:', testCourses.length);
    testCourses.forEach(course => {
      console.log(`  - ${(course as any).title}`);
    });

  } catch (error) {
    console.error('❌ Error testing enrollment:', error);
  } finally {
    await app.close();
  }
}

testEnrollment();
