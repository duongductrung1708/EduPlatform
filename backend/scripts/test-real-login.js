const https = require('https');
const http = require('http');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testRealLogin() {
  try {
    console.log('🧪 Testing real login and JWT...');
    
    // Step 1: Login to get real JWT token
    console.log('\n🔐 Step 1: Login with real credentials...');
    const loginResult = await makeRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: {
        email: 'student1@example.com',
        password: 'password123'
      }
    });
    
    console.log('Login Status:', loginResult.status);
    console.log('Login Response:', JSON.stringify(loginResult.data, null, 2));
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResult.data.access_token;
    console.log('✅ Got real token:', token.substring(0, 50) + '...');
    
    // Step 2: Test my-enrolled endpoint with real token
    console.log('\n🎓 Step 2: Test /api/courses/my-enrolled with real token...');
    const enrolledResult = await makeRequest('http://localhost:3000/api/courses/my-enrolled', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('My-enrolled Status:', enrolledResult.status);
    console.log('My-enrolled Response:', JSON.stringify(enrolledResult.data, null, 2));
    
    // Step 3: Test another protected endpoint
    console.log('\n🔒 Step 3: Test another protected endpoint...');
    const protectedResult = await makeRequest('http://localhost:3000/api/classes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Protected endpoint Status:', protectedResult.status);
    console.log('Protected endpoint Response:', JSON.stringify(protectedResult.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testRealLogin();
