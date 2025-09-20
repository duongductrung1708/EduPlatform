const { MongoClient } = require('mongodb');

async function createEnrollment() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduplatform';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    
    // Find a student
    const student = await db.collection('users').findOne({ role: 'student' });
    if (!student) {
      console.log('❌ No student found');
      return;
    }
    console.log('✅ Found student:', student.email);

    // Find a published course
    const course = await db.collection('courses').findOne({ 
      status: 'published',
      visibility: 'public'
    });
    if (!course) {
      console.log('❌ No published course found');
      return;
    }
    console.log('✅ Found course:', course.title);

    // Check if already enrolled
    const existingEnrollment = await db.collection('courseenrollments').findOne({
      studentId: student._id,
      courseId: course._id
    });

    if (existingEnrollment) {
      console.log('⏭️  Student already enrolled in this course');
      return;
    }

    // Create enrollment
    const enrollment = {
      studentId: student._id,
      courseId: course._id,
      enrolledAt: new Date(),
      progress: {
        completedLessons: [],
        completedModules: [],
        totalLessons: 0,
        totalModules: 0,
        percentage: 0
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('courseenrollments').insertOne(enrollment);
    console.log('✅ Enrollment created successfully!');

    // Update course enrollment count
    await db.collection('courses').updateOne(
      { _id: course._id },
      { $inc: { enrollmentCount: 1 } }
    );
    console.log('✅ Course enrollment count updated!');

    // Test the enrollment
    const testEnrollment = await db.collection('courseenrollments').findOne({
      studentId: student._id,
      courseId: course._id
    });
    
    if (testEnrollment) {
      console.log('🎉 Enrollment test successful!');
      console.log('Student:', student.email);
      console.log('Course:', course.title);
      console.log('Enrollment ID:', testEnrollment._id);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createEnrollment();
