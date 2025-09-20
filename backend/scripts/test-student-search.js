const { MongoClient, ObjectId } = require('mongodb');

// Replace with your MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduplatform';
const client = new MongoClient(uri);

async function testStudentSearch() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    const testEmail = 'trungyna1708@gmail.com';
    console.log(`\n🔍 Searching for student with email: ${testEmail}`);

    // Test 1: Exact match
    console.log('\n1. Exact match search:');
    const exactMatch = await usersCollection.findOne({ email: testEmail });
    console.log('Result:', exactMatch ? {
      _id: exactMatch._id,
      email: exactMatch.email,
      name: exactMatch.name,
      role: exactMatch.role
    } : 'null');

    // Test 2: Case insensitive search
    console.log('\n2. Case insensitive search:');
    const caseInsensitive = await usersCollection.findOne({ 
      email: { $regex: `^${testEmail}$`, $options: 'i' } 
    });
    console.log('Result:', caseInsensitive ? {
      _id: caseInsensitive._id,
      email: caseInsensitive.email,
      name: caseInsensitive.name,
      role: caseInsensitive.role
    } : 'null');

    // Test 3: Search with student role
    console.log('\n3. Search with student role:');
    const withRole = await usersCollection.findOne({ 
      email: { $regex: `^${testEmail}$`, $options: 'i' },
      role: 'student'
    });
    console.log('Result:', withRole ? {
      _id: withRole._id,
      email: withRole.email,
      name: withRole.name,
      role: withRole.role
    } : 'null');

    // Test 4: Find all users with similar email
    console.log('\n4. All users with similar email:');
    const similarEmails = await usersCollection.find({ 
      email: { $regex: testEmail, $options: 'i' } 
    }).toArray();
    console.log('Results:', similarEmails.map(u => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role
    })));

    // Test 5: Find all students
    console.log('\n5. All students in database:');
    const allStudents = await usersCollection.find({ role: 'student' }).toArray();
    console.log(`Found ${allStudents.length} students:`);
    allStudents.forEach(student => {
      console.log(`  - ${student.email} (${student.name}) [${student._id}]`);
    });

    // Test 6: Find all users (any role)
    console.log('\n6. All users in database:');
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`Found ${allUsers.length} total users:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) [${user.role}] [${user._id}]`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testStudentSearch();
