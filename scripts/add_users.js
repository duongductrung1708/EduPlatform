const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eduplatform';

const newUsers = [
  {
    name: 'Nguyễn Văn Giáo Viên',
    email: 'teacher1@example.com',
    password: 'password123',
    role: 'teacher',
    avatar: 'https://via.placeholder.com/150',
    phone: '0123456789',
    address: 'Hà Nội, Việt Nam',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'male',
    isActive: true,
  },
  {
    name: 'Trần Thị Học Sinh',
    email: 'student1@example.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://via.placeholder.com/150',
    phone: '0987654321',
    address: 'TP.HCM, Việt Nam',
    dateOfBirth: new Date('2005-08-20'),
    gender: 'female',
    isActive: true,
  },
  {
    name: 'Lê Văn Phụ Huynh',
    email: 'parent1@example.com',
    password: 'password123',
    role: 'parent',
    avatar: 'https://via.placeholder.com/150',
    phone: '0369852147',
    address: 'Đà Nẵng, Việt Nam',
    dateOfBirth: new Date('1985-12-10'),
    gender: 'male',
    isActive: true,
  },
  {
    name: 'Phạm Thị Giáo Viên 2',
    email: 'teacher2@example.com',
    password: 'password123',
    role: 'teacher',
    avatar: 'https://via.placeholder.com/150',
    phone: '0147258369',
    address: 'Cần Thơ, Việt Nam',
    dateOfBirth: new Date('1988-03-25'),
    gender: 'female',
    isActive: true,
  },
  {
    name: 'Hoàng Văn Học Sinh 2',
    email: 'student2@example.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://via.placeholder.com/150',
    phone: '0258741963',
    address: 'Hải Phòng, Việt Nam',
    dateOfBirth: new Date('2006-11-12'),
    gender: 'male',
    isActive: true,
  },
];

async function addUsers() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Hash passwords
    const hashedUsers = await Promise.all(
      newUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    
    // Insert users
    const result = await usersCollection.insertMany(hashedUsers);
    console.log(`✅ Successfully added ${result.insertedCount} users:`);
    
    newUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n📋 Login credentials:');
    console.log('Password: password123');
    console.log('(All users have the same password for testing)');
    
  } catch (error) {
    console.error('❌ Error adding users:', error);
  } finally {
    await client.close();
  }
}

addUsers();
