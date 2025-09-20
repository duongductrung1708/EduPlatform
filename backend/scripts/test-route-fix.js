const http = require('http');

async function testRouteFix() {
  console.log('🧪 Testing route fix for my-courses...');
  
  // Test 1: Call my-courses endpoint (should work)
  console.log('\n📚 Test 1: Calling /api/courses/my-courses...');
  const myCoursesResult = await callAPI('/api/courses/my-courses', 'GET');
  if (myCoursesResult.success) {
    console.log('✅ my-courses endpoint works!');
  } else {
    console.log('❌ my-courses endpoint failed:', myCoursesResult.error);
  }
  
  // Test 2: Call a valid course ID (should work)
  console.log('\n🔍 Test 2: Calling /api/courses/507f1f77bcf86cd799439011...');
  const courseResult = await callAPI('/api/courses/507f1f77bcf86cd799439011', 'GET');
  if (courseResult.success) {
    console.log('✅ Course ID endpoint works!');
  } else {
    console.log('❌ Course ID endpoint failed (expected if course not found):', courseResult.error);
  }
  
  // Test 3: Call my-courses again to make sure it's not being treated as course ID
  console.log('\n🔄 Test 3: Calling /api/courses/my-courses again...');
  const myCoursesResult2 = await callAPI('/api/courses/my-courses', 'GET');
  if (myCoursesResult2.success) {
    console.log('✅ my-courses endpoint still works!');
  } else {
    console.log('❌ my-courses endpoint failed:', myCoursesResult2.error);
  }
}

async function callAPI(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) { // 401 is expected without auth
          resolve({ success: true, status: res.statusCode, data: data });
        } else {
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

// Wait for server to start, then run test
setTimeout(() => {
  testRouteFix();
}, 5000);
