const { MongoClient } = require('mongodb');

async function createEnrollmentData() {
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

    // Find published courses
    const courses = await db.collection('courses').find({ status: 'published' }).toArray();
    console.log('✅ Found courses:', courses.length);

    if (courses.length === 0) {
      console.log('❌ No published courses found');
      return;
    }

    // Check existing enrollments
    const existingEnrollments = await db.collection('courseenrollments').find({
      studentId: student._id,
      isActive: true
    }).toArray();

    console.log('📚 Existing enrollments:', existingEnrollments.length);

    // Create enrollment if none exist
    if (existingEnrollments.length === 0) {
      const course = courses[0];
      console.log(`🎓 Creating enrollment for: ${course.title}`);
      
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
      console.log('✅ Enrollment created!');

      // Update course enrollment count
      await db.collection('courses').updateOne(
        { _id: course._id },
        { $inc: { enrollmentCount: 1 } }
      );
    }

    // Test the enrollment data
    const testEnrollments = await db.collection('courseenrollments')
      .find({ studentId: student._id, isActive: true })
      .toArray();

    console.log('\n🔍 Test results:');
    console.log('Total enrollments:', testEnrollments.length);
    
    for (const enrollment of testEnrollments) {
      const course = await db.collection('courses').findOne({ _id: enrollment.courseId });
      console.log(`  - ${course?.title || 'Unknown Course'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createEnrollmentData();
