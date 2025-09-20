const http = require('http');

async function testMyCoursesAPI() {
  console.log('🧪 Testing my-courses API endpoint...');
  
  // First, login as teacher to get token
  const teacherToken = await loginAsTeacher();
  if (!teacherToken) {
    console.log('❌ Failed to login as teacher');
    return;
  }
  
  // Call the my-courses API
  console.log('\n📚 Calling my-courses API...');
  const result = await getMyCourses(teacherToken);
  if (result) {
    console.log('✅ API call successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } else {
    console.log('❌ API call failed');
  }
}

async function loginAsTeacher() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'teacher@example.com', // Replace with actual teacher email
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.accessToken);
        } else {
          console.log('Teacher login failed:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Teacher login request failed:', error.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function getMyCourses(token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/courses/my-courses',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response);
        } else {
          console.log('Get my-courses failed:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Get my-courses request failed:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Wait for server to start, then run test
setTimeout(() => {
  testMyCoursesAPI();
}, 5000);
