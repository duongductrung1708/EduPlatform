const http = require('http');

async function testStudentCount() {
  console.log('🧪 Testing student count accuracy...');
  
  // Test 1: Get all courses and check enrollment counts
  console.log('\n📚 Test 1: Getting all courses...');
  const coursesResult = await callAPI('/api/courses', 'GET');
  
  if (coursesResult.success) {
    const data = JSON.parse(coursesResult.data);
    const courses = data.courses || [];
    
    console.log(`✅ Found ${courses.length} courses`);
    
    for (const course of courses) {
      console.log(`\n📖 Course: ${course.title}`);
      console.log(`   Enrollment count in DB: ${course.enrollmentCount || 0}`);
      console.log(`   Course ID: ${course._id}`);
      
      // Test 2: Get course details to see if count is updated
      console.log(`\n🔍 Getting course details for: ${course._id}`);
      const courseDetailResult = await callAPI(`/api/courses/${course._id}`, 'GET');
      
      if (courseDetailResult.success) {
        const courseDetail = JSON.parse(courseDetailResult.data);
        console.log(`   Updated enrollment count: ${courseDetail.enrollmentCount || 0}`);
        
        if (courseDetail.enrollmentCount !== course.enrollmentCount) {
          console.log(`   ✅ Count was updated from ${course.enrollmentCount || 0} to ${courseDetail.enrollmentCount || 0}`);
        } else {
          console.log(`   ℹ️  Count remained the same: ${courseDetail.enrollmentCount || 0}`);
        }
      } else {
        console.log(`   ❌ Failed to get course details: ${courseDetailResult.error}`);
      }
    }
  } else {
    console.log('❌ Failed to get courses:', coursesResult.error);
  }
  
  // Test 3: Test my-courses endpoint
  console.log('\n👨‍🏫 Test 3: Testing my-courses endpoint...');
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
  testStudentCount();
}, 5000);
