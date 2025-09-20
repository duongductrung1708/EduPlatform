const { MongoClient, ObjectId } = require('mongodb');

// Use the same connection string as test-atlas.js
const uri = 'mongodb+srv://trungyna1708:trungyna1708@eduplatform.ebo56f9.mongodb.net/eduplatform?retryWrites=true&w=majority&appName=eduplatform';
const client = new MongoClient(uri);

async function listStudents() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Get all students
    const students = await usersCollection.find({ role: 'student' }).toArray();
    console.log(`\n🎓 Found ${students.length} students:`);
    
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.email} (${student.name}) [${student._id}]`);
    });

    // Get all users (any role)
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`\n👥 All users (${allUsers.length} total):`);
    
    const usersByRole = {};
    allUsers.forEach(user => {
      const role = user.role || 'no-role';
      if (!usersByRole[role]) usersByRole[role] = [];
      usersByRole[role].push(user);
    });

    Object.keys(usersByRole).forEach(role => {
      console.log(`\n${role.toUpperCase()} (${usersByRole[role].length} users):`);
      usersByRole[role].forEach(user => {
        console.log(`  - ${user.email} (${user.name}) [${user._id}]`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB Atlas');
  }
}

listStudents();
