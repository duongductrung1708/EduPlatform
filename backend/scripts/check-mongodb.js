#!/usr/bin/env node

/**
 * Script kiểm tra kết nối MongoDB
 * Usage: node scripts/check-mongodb.js
 */

const mongoose = require('mongoose');

async function checkMongoDB() {
  console.log('🔍 Kiểm tra kết nối MongoDB...\n');
  
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/eduplatform';
  
  console.log('📡 Connection URI:', mongoUri.replace(/:\/\/[\w-]+:(.*?)@/, '://***:***@'));
  
  try {
    // Kết nối MongoDB
    console.log('⏳ Đang kết nối...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });
    
    console.log('✅ Kết nối MongoDB thành công!');
    
    // Kiểm tra database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Database: ${db.databaseName}`);
    console.log(`📁 Collections: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('   - ' + collections.map(c => c.name).join('\n   - '));
    }
    
    // Kiểm tra một số collections quan trọng
    const importantCollections = ['users', 'classrooms', 'courses', 'assignments'];
    for (const collectionName of importantCollections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`   📄 ${collectionName}: ${count} documents`);
      } catch (err) {
        console.log(`   ❌ ${collectionName}: Không tồn tại`);
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:');
    console.error('   ', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Giải pháp:');
      console.log('   1. Kiểm tra MongoDB đã được cài đặt chưa');
      console.log('   2. Khởi động MongoDB service');
      console.log('   3. Kiểm tra port 27017 có bị chiếm không');
      console.log('   4. Xem hướng dẫn trong MONGODB_SETUP.md');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Giải pháp:');
      console.log('   1. Kiểm tra username/password trong connection string');
      console.log('   2. Đảm bảo user có quyền truy cập database');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 Giải pháp:');
      console.log('   1. Kiểm tra network connection');
      console.log('   2. Kiểm tra firewall settings');
      console.log('   3. Thử tăng timeout trong connection options');
    }
    
    process.exit(1);
  } finally {
    // Đóng kết nối
    await mongoose.disconnect();
    console.log('\n👋 Đã đóng kết nối MongoDB');
  }
}

// Chạy script
checkMongoDB().catch(console.error);
