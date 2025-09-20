const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Simple schemas for data creation
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'teacher', 'student', 'parent', 'guest'] },
  passwordHash: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  category: String,
  level: String,
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'published' },
  visibility: { type: String, default: 'public' },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxStudents: { type: Number, default: 30 },
  status: { type: String, default: 'active' },
  inviteCode: String,
  schedule: {
    startDate: Date,
    endDate: Date,
    timezone: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Classroom = mongoose.model('Classroom', classroomSchema);

async function createSampleData() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eduplatform');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Classroom.deleteMany({});

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('password123', 10);
    const admin = new User({
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      passwordHash: adminPasswordHash,
      verified: true,
    });
    await admin.save();
    console.log('✅ Created admin user');

    // Create teacher users
    const teacherPasswordHash = await bcrypt.hash('password123', 10);
    const teacher1 = new User({
      email: 'teacher1@example.com',
      name: 'Nguyễn Văn A',
      role: 'teacher',
      passwordHash: teacherPasswordHash,
      verified: true,
    });
    await teacher1.save();
    console.log('✅ Created teacher1');

    const teacher2 = new User({
      email: 'teacher2@example.com',
      name: 'Trần Thị B',
      role: 'teacher',
      passwordHash: teacherPasswordHash,
      verified: true,
    });
    await teacher2.save();
    console.log('✅ Created teacher2');

    // Create student users
    const studentPasswordHash = await bcrypt.hash('password123', 10);
    const students = [];
    for (let i = 1; i <= 20; i++) {
      const student = new User({
        email: `student${i}@example.com`,
        name: `Học sinh ${i}`,
        role: 'student',
        passwordHash: studentPasswordHash,
        verified: true,
      });
      await student.save();
      students.push(student);
    }
    console.log('✅ Created 20 students');

    // Create parent users
    const parentPasswordHash = await bcrypt.hash('password123', 10);
    for (let i = 1; i <= 10; i++) {
      const parent = new User({
        email: `parent${i}@example.com`,
        name: `Phụ huynh ${i}`,
        role: 'parent',
        passwordHash: parentPasswordHash,
        verified: true,
      });
      await parent.save();
    }
    console.log('✅ Created 10 parents');

    // Create courses
    const courses = [];
    const courseData = [
      { title: 'Toán học cơ bản', category: 'Toán học', level: 'Cơ bản' },
      { title: 'Vật lý nâng cao', category: 'Vật lý', level: 'Nâng cao' },
      { title: 'Hóa học hữu cơ', category: 'Hóa học', level: 'Trung bình' },
      { title: 'Lịch sử Việt Nam', category: 'Lịch sử', level: 'Cơ bản' },
      { title: 'Tiếng Anh giao tiếp', category: 'Ngoại ngữ', level: 'Cơ bản' },
      { title: 'Sinh học tế bào', category: 'Sinh học', level: 'Nâng cao' },
      { title: 'Địa lý thế giới', category: 'Địa lý', level: 'Trung bình' },
      { title: 'Văn học Việt Nam', category: 'Văn học', level: 'Cơ bản' },
    ];

    for (const courseInfo of courseData) {
      const slug = courseInfo.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      const course = new Course({
        title: courseInfo.title,
        slug: slug,
        description: `Mô tả cho khóa học ${courseInfo.title}`,
        category: courseInfo.category,
        level: courseInfo.level,
        createdBy: teacher1._id,
        status: 'published',
        visibility: 'public',
        tags: [courseInfo.category.toLowerCase(), courseInfo.level.toLowerCase()],
      });
      await course.save();
      courses.push(course);
    }
    console.log('✅ Created 8 courses');

    // Create classrooms
    for (let i = 0; i < 5; i++) {
      const course = courses[i];
      const classroomStudents = students.slice(i * 4, (i + 1) * 4);
      
      const classroom = new Classroom({
        name: `Lớp ${course.title} - ${i + 1}`,
        description: `Lớp học ${course.title}`,
        courseId: course._id,
        teacherId: i % 2 === 0 ? teacher1._id : teacher2._id,
        students: classroomStudents.map(s => s._id),
        maxStudents: 30,
        status: 'active',
        inviteCode: `INVITE${i + 1}`,
        schedule: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
      await classroom.save();
    }
    console.log('✅ Created 5 classrooms');

    console.log('🎉 Sample data created successfully!');
    console.log('📊 Summary:');
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Courses: ${await Course.countDocuments()}`);
    console.log(`- Classrooms: ${await Classroom.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

createSampleData();
