const { MongoClient, ObjectId } = require('mongodb');

// Use the same connection string as test-atlas.js
const uri = 'mongodb+srv://trungyna1708:trungyna1708@eduplatform.ebo56f9.mongodb.net/eduplatform?retryWrites=true&w=majority&appName=eduplatform';
const client = new MongoClient(uri);

async function createStudent() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db();
    const usersCollection = db.collection('users');

    const studentEmail = 'trungyna1708@gmail.com';
    const studentName = 'Trung Yna';
    
    // Check if student already exists
    const existingStudent = await usersCollection.findOne({ email: studentEmail });
    if (existingStudent) {
      console.log('✅ Student already exists:', {
        _id: existingStudent._id,
        email: existingStudent.email,
        name: existingStudent.name,
        role: existingStudent.role
      });
      return;
    }

    // Create new student
    const newStudent = {
      email: studentEmail,
      name: studentName,
      password: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', // hashed password: password123
      role: 'student',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newStudent);
    console.log('✅ Student created successfully:', {
      _id: result.insertedId,
      email: studentEmail,
      name: studentName,
      role: 'student'
    });

    // Verify the student was created
    const createdStudent = await usersCollection.findOne({ _id: result.insertedId });
    console.log('✅ Verification - Student found:', {
      _id: createdStudent._id,
      email: createdStudent.email,
      name: createdStudent.name,
      role: createdStudent.role
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB Atlas');
  }
}

createStudent();
