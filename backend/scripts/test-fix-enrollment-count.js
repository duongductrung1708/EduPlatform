const http = require('http');

async function testFixEnrollmentCount() {
  console.log('🧪 Testing fix enrollment count API...');
  
  // First, login as admin to get token
  const adminToken = await loginAsAdmin();
  if (!adminToken) {
    console.log('❌ Failed to login as admin');
    return;
  }
  
  // Call the fix enrollment counts API
  console.log('\n🔧 Calling fix enrollment counts API...');
  const result = await fixEnrollmentCounts(adminToken);
  if (result) {
    console.log('✅ API call successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } else {
    console.log('❌ API call failed');
  }
}

async function loginAsAdmin() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'admin@example.com', // Replace with actual admin email
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
          console.log('Admin login failed:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Admin login request failed:', error.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function fixEnrollmentCounts(token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/courses/fix-enrollment-counts',
      method: 'POST',
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
          console.log('Fix enrollment counts failed:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Fix enrollment counts request failed:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Wait for server to start, then run test
setTimeout(() => {
  testFixEnrollmentCount();
}, 3000);
