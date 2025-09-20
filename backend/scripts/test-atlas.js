#!/usr/bin/env node

/**
 * Script test kết nối MongoDB Atlas
 * Usage: node scripts/test-atlas.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testAtlasConnection() {
  console.log('☁️  Test kết nối MongoDB Atlas...\n');
  
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('❌ Không tìm thấy MONGO_URI trong file .env');
    console.log('📝 Hãy tạo file .env với nội dung:');
    console.log('   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplatform');
    process.exit(1);
  }
  
  // Ẩn password trong log
  const safeUri = mongoUri.replace(/:\/\/[\w-]+:(.*?)@/, '://***:***@');
  console.log('📡 Connection URI:', safeUri);
  
  // Kiểm tra format
  if (!mongoUri.includes('mongodb+srv://')) {
    console.log('⚠️  Cảnh báo: URI không phải MongoDB Atlas format');
    console.log('   Atlas URI thường bắt đầu với: mongodb+srv://');
  }
  
  try {
    console.log('⏳ Đang kết nối đến MongoDB Atlas...');
    
    // Kết nối với timeout ngắn hơn cho Atlas
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('✅ Kết nối MongoDB Atlas thành công!');
    
    // Kiểm tra thông tin cluster
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    try {
      const serverStatus = await admin.serverStatus();
      console.log(`🏷️  MongoDB Version: ${serverStatus.version}`);
      console.log(`🌍 Host: ${serverStatus.host}`);
    } catch (err) {
      console.log('ℹ️  Không thể lấy thông tin server (có thể do permissions)');
    }
    
    // Kiểm tra database
    console.log(`📊 Database: ${db.databaseName}`);
    
    // Liệt kê collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('   - ' + collections.map(c => c.name).join('\n   - '));
      
      // Đếm documents trong collections quan trọng
      const importantCollections = ['users', 'classrooms', 'courses', 'assignments'];
      for (const collectionName of importantCollections) {
        try {
          const count = await db.collection(collectionName).countDocuments();
          console.log(`   📄 ${collectionName}: ${count} documents`);
        } catch (err) {
          // Collection không tồn tại
        }
      }
    } else {
      console.log('ℹ️  Database trống - sẽ được tạo khi ứng dụng chạy');
    }
    
    // Test write operation
    try {
      const testCollection = db.collection('connection_test');
      await testCollection.insertOne({ 
        test: true, 
        timestamp: new Date(),
        message: 'MongoDB Atlas connection test successful'
      });
      
      const testDoc = await testCollection.findOne({ test: true });
      if (testDoc) {
        console.log('✅ Test write/read operation thành công');
        await testCollection.deleteOne({ _id: testDoc._id });
        console.log('🧹 Đã dọn dẹp test document');
      }
    } catch (err) {
      console.log('⚠️  Test write operation thất bại:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB Atlas:');
    console.error('   ', error.message);
    
    // Phân tích lỗi cụ thể
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Giải pháp Authentication:');
      console.log('   1. Kiểm tra username/password trong connection string');
      console.log('   2. Đảm bảo user có quyền "Read and write to any database"');
      console.log('   3. Kiểm tra Database Access trong MongoDB Atlas dashboard');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 Giải pháp Timeout:');
      console.log('   1. Kiểm tra kết nối internet');
      console.log('   2. Kiểm tra Network Access trong MongoDB Atlas');
      console.log('   3. Thêm IP address hiện tại vào whitelist');
      console.log('   4. Thử tăng timeout trong connection options');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('\n🔧 Giải pháp DNS:');
      console.log('   1. Kiểm tra connection string có đúng không');
      console.log('   2. Kiểm tra cluster name trong MongoDB Atlas');
      console.log('   3. Thử ping cluster URL');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Giải pháp Connection:');
      console.log('   1. Kiểm tra Network Access settings');
      console.log('   2. Đảm bảo IP address được whitelist');
      console.log('   3. Kiểm tra firewall settings');
    }
    
    console.log('\n📖 Xem hướng dẫn chi tiết: MONGODB_ATLAS_SETUP.md');
    process.exit(1);
  } finally {
    // Đóng kết nối
    await mongoose.disconnect();
    console.log('\n👋 Đã đóng kết nối MongoDB Atlas');
  }
}

// Chạy script
testAtlasConnection().catch(console.error);
