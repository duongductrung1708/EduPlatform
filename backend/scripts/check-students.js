const { MongoClient, ObjectId } = require('mongodb');

// Replace with your MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduplatform';
const client = new MongoClient(uri);

async function checkStudents() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Get all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`\n📊 Total users in database: ${allUsers.length}`);

    // Group by role
    const usersByRole = {};
    allUsers.forEach(user => {
      const role = user.role || 'no-role';
      if (!usersByRole[role]) usersByRole[role] = [];
      usersByRole[role].push({
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    });

    console.log('\n👥 Users by role:');
    Object.keys(usersByRole).forEach(role => {
      console.log(`\n${role.toUpperCase()} (${usersByRole[role].length} users):`);
      usersByRole[role].forEach(user => {
        console.log(`  - ${user.email} (${user.name}) [${user._id}]`);
      });
    });

    // Check for students specifically
    const students = await usersCollection.find({ role: 'student' }).toArray();
    console.log(`\n🎓 Students found: ${students.length}`);
    students.forEach(student => {
      console.log(`  - ${student.email} (${student.name}) [${student._id}]`);
    });

    // Check for any user with email containing common patterns
    const commonEmails = ['test', 'student', 'user', 'demo'];
    for (const pattern of commonEmails) {
      const users = await usersCollection.find({ 
        email: { $regex: pattern, $options: 'i' } 
      }).toArray();
      if (users.length > 0) {
        console.log(`\n🔍 Users with email containing '${pattern}':`);
        users.forEach(user => {
          console.log(`  - ${user.email} (${user.name}) [${user.role}] [${user._id}]`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkStudents();
