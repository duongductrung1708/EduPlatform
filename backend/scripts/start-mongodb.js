#!/usr/bin/env node

/**
 * Script khởi động MongoDB tự động
 * Usage: node scripts/start-mongodb.js
 */

const { spawn, exec } = require('child_process');
const os = require('os');

async function startMongoDB() {
  console.log('🚀 Khởi động MongoDB...\n');
  
  const platform = os.platform();
  
  try {
    if (platform === 'win32') {
      // Windows
      console.log('🪟 Phát hiện Windows, khởi động MongoDB service...');
      
      exec('net start MongoDB', (error, stdout, stderr) => {
        if (error) {
          if (error.message.includes('service name is invalid')) {
            console.log('❌ MongoDB service chưa được cài đặt');
            console.log('📥 Hãy cài đặt MongoDB từ: https://www.mongodb.com/try/download/community');
          } else if (error.message.includes('service is already running')) {
            console.log('✅ MongoDB service đã chạy');
          } else {
            console.error('❌ Lỗi khởi động MongoDB:', error.message);
          }
        } else {
          console.log('✅ MongoDB service đã khởi động thành công');
        }
      });
      
    } else if (platform === 'darwin') {
      // macOS
      console.log('🍎 Phát hiện macOS, khởi động MongoDB...');
      
      exec('brew services start mongodb/brew/mongodb-community', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Lỗi khởi động MongoDB:', error.message);
          console.log('📥 Hãy cài đặt MongoDB: brew install mongodb-community');
        } else {
          console.log('✅ MongoDB đã khởi động thành công');
        }
      });
      
    } else if (platform === 'linux') {
      // Linux
      console.log('🐧 Phát hiện Linux, khởi động MongoDB...');
      
      exec('sudo systemctl start mongod', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Lỗi khởi động MongoDB:', error.message);
          console.log('📥 Hãy cài đặt MongoDB: sudo apt-get install mongodb-org');
        } else {
          console.log('✅ MongoDB đã khởi động thành công');
        }
      });
      
    } else {
      console.log('❓ Hệ điều hành không được hỗ trợ:', platform);
      console.log('📖 Hãy tham khảo hướng dẫn trong MONGODB_SETUP.md');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

// Chạy script
startMongoDB();
