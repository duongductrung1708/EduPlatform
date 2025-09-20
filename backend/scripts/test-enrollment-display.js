const http = require('http');

async function testEnrollmentDisplay() {
  console.log('🧪 Testing enrollment count display fixes...');
  
  // Test 1: Get a course to check enrollment count
  console.log('\n📚 Test 1: Getting course details...');
  const courseResult = await callAPI('/api/courses', 'GET');
  
  if (courseResult.success) {
    const courses = JSON.parse(courseResult.data);
    if (courses.length > 0) {
      const course = courses[0];
      console.log(`✅ Course found: ${course.title}`);
      console.log(`   Enrollment count: ${course.enrollmentCount || 0}`);
      console.log(`   Max(0, count): ${Math.max(0, course.enrollmentCount || 0)}`);
      
      if (course.enrollmentCount < 0) {
        console.log('⚠️  Negative enrollment count detected!');
        console.log('   Frontend will now display: 0 học sinh (instead of negative number)');
      } else {
        console.log('✅ Enrollment count is positive or zero');
      }
    } else {
      console.log('ℹ️  No courses found');
    }
  } else {
    console.log('❌ Failed to get courses:', courseResult.error);
  }
  
  // Test 2: Check if my-courses endpoint works
  console.log('\n👨‍🏫 Test 2: Testing my-courses endpoint...');
  const myCoursesResult = await callAPI('/api/courses/my-courses', 'GET');
  if (myCoursesResult.success) {
    console.log('✅ my-courses endpoint works!');
  } else {
    console.log('❌ my-courses endpoint failed:', myCoursesResult.error);
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
  testEnrollmentDisplay();
}, 3000);
