const { MongoClient, ObjectId } = require('mongodb');

// Use the same connection string as other scripts
const uri = 'mongodb+srv://trungyna1708:trungyna1708@eduplatform.ebo56f9.mongodb.net/eduplatform?retryWrites=true&w=majority&appName=eduplatform';
const client = new MongoClient(uri);

async function fixEnrollmentCounts() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db();
    const coursesCollection = db.collection('courses');
    const enrollmentsCollection = db.collection('courseenrollments');

    console.log('\n🔍 Finding all courses...');
    const courses = await coursesCollection.find({}).toArray();
    console.log(`Found ${courses.length} courses`);

    for (const course of courses) {
      console.log(`\n📚 Processing course: ${course.title} (${course._id})`);
      
      // Count active enrollments for this course
      const activeEnrollmentsCount = await enrollmentsCollection.countDocuments({
        courseId: course._id,
        isActive: true
      });

      console.log(`  Current enrollmentCount in DB: ${course.enrollmentCount || 0}`);
      console.log(`  Actual active enrollments: ${activeEnrollmentsCount}`);

      // Update the course with correct count
      if (course.enrollmentCount !== activeEnrollmentsCount) {
        await coursesCollection.updateOne(
          { _id: course._id },
          { $set: { enrollmentCount: activeEnrollmentsCount } }
        );
        console.log(`  ✅ Updated enrollmentCount from ${course.enrollmentCount || 0} to ${activeEnrollmentsCount}`);
      } else {
        console.log(`  ✅ Count is already correct`);
      }
    }

    console.log('\n🎉 All enrollment counts have been fixed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB Atlas');
  }
}

fixEnrollmentCounts();
