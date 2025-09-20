// Test registration API to create a student
const http = require('http');

function testRegistration() {
  const postData = JSON.stringify({
    email: 'trungyna1708@gmail.com',
    name: 'Trung Yna',
    password: 'password123',
    role: 'student'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Registration API Status: ${res.statusCode}`);
    console.log('Response headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response data:', data);
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Student created successfully!');
        console.log('Now you can try adding this student to the course.');
      } else {
        console.log('❌ Registration failed. Student might already exist.');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Registration request failed:', error.message);
  });

  req.write(postData);
  req.end();
}

console.log('🧪 Testing student registration...');
console.log('Email: trungyna1708@gmail.com');
console.log('Name: Trung Yna');
console.log('Role: student');
console.log('Password: password123');
console.log('');

testRegistration();
