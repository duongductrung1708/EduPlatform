const { MongoClient, ObjectId } = require('mongodb');

// Use the same connection string as test-atlas.js
const uri = 'mongodb+srv://trungyna1708:trungyna1708@eduplatform.ebo56f9.mongodb.net/eduplatform?retryWrites=true&w=majority&appName=eduplatform';
const client = new MongoClient(uri);

async function testSpecificEmail() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

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

    // Test 6: Find user with this exact email (any role)
    console.log('\n6. User with exact email (any role):');
    const anyUser = await usersCollection.findOne({ 
      email: testEmail 
    });
    console.log('Result:', anyUser ? {
      _id: anyUser._id,
      email: anyUser.email,
      name: anyUser.name,
      role: anyUser.role
    } : 'null');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB Atlas');
  }
}

testSpecificEmail();
