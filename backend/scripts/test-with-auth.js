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

async function testWithAuth() {
  try {
    console.log('🧪 Testing API with authentication...');
    
    // Step 1: Login to get JWT token
    console.log('\n🔐 Step 1: Login...');
    const loginResult = await makeRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: {
        email: 'student1@example.com',
        password: 'password123'
      }
    });
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed:', loginResult.data);
      return;
    }
    
    const token = loginResult.data.access_token;
    console.log('✅ Login successful, got token');
    
    // Step 2: Test my-enrolled endpoint
    console.log('\n🎓 Step 2: Test /api/courses/my-enrolled...');
    const enrolledResult = await makeRequest('http://localhost:3000/api/courses/my-enrolled', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', enrolledResult.status);
    console.log('Data:', JSON.stringify(enrolledResult.data, null, 2));
    
    // Step 3: Test public courses endpoint
    console.log('\n📚 Step 3: Test /api/courses/public...');
    const publicResult = await makeRequest('http://localhost:3000/api/courses/public');
    
    console.log('Status:', publicResult.status);
    console.log('Courses count:', publicResult.data.courses?.length || 0);
    
    // Step 4: Enroll in a course if not enrolled
    if (enrolledResult.data.courses?.length === 0 && publicResult.data.courses?.length > 0) {
      console.log('\n🎯 Step 4: Enrolling in first course...');
      const courseId = publicResult.data.courses[0]._id;
      
      const enrollResult = await makeRequest(`http://localhost:3000/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Enroll status:', enrollResult.status);
      console.log('Enroll result:', enrollResult.data);
      
      // Test my-enrolled again
      console.log('\n🔄 Step 5: Test /api/courses/my-enrolled again...');
      const enrolledResult2 = await makeRequest('http://localhost:3000/api/courses/my-enrolled', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Status:', enrolledResult2.status);
      console.log('Data:', JSON.stringify(enrolledResult2.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testWithAuth();
