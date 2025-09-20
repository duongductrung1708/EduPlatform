const { MongoClient, ObjectId } = require('mongodb');

// Use the same connection string as test-atlas.js
const uri = 'mongodb+srv://trungyna1708:trungyna1708@eduplatform.ebo56f9.mongodb.net/eduplatform?retryWrites=true&w=majority&appName=eduplatform';
const client = new MongoClient(uri);

async function fixEmailTypo() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db();
    const usersCollection = db.collection('users');

    const oldEmail = 'trungyna1708@gmai.com';
    const newEmail = 'trungyna1708@gmail.com';
    
    console.log(`\n🔍 Looking for user with email: ${oldEmail}`);
    
    // Find user with typo email
    const user = await usersCollection.findOne({ email: oldEmail });
    if (!user) {
      console.log('❌ User not found with typo email');
      return;
    }

    console.log('✅ Found user:', {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Check if new email already exists
    const existingUser = await usersCollection.findOne({ email: newEmail });
    if (existingUser) {
      console.log('❌ User already exists with correct email:', {
        _id: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role
      });
      return;
    }

    // Update email
    console.log(`\n🔧 Updating email from ${oldEmail} to ${newEmail}...`);
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: { email: newEmail, updatedAt: new Date() } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Email updated successfully!');
      
      // Verify the update
      const updatedUser = await usersCollection.findOne({ _id: user._id });
      console.log('✅ Verification - Updated user:', {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      });
    } else {
      console.log('❌ Failed to update email');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB Atlas');
  }
}

fixEmailTypo();
