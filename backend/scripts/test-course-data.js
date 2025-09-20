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

async function testCourseData() {
  try {
    console.log('🧪 Testing Course Data...');
    
    // Step 1: Login as teacher
    console.log('\n🔐 Step 1: Login as teacher...');
    const loginResult = await makeRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: {
        email: 'teacher1@example.com',
        password: 'password123'
      }
    });
    
    if (loginResult.status !== 200) {
      console.log('❌ Teacher login failed:', loginResult.data);
      return;
    }
    
    const token = loginResult.data.accessToken;
    console.log('✅ Teacher login successful');
    
    // Step 2: Get my courses
    console.log('\n📚 Step 2: Get my courses...');
    const myCoursesResult = await makeRequest('http://localhost:3000/api/courses/my-courses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', myCoursesResult.status);
    console.log('My courses count:', myCoursesResult.data.courses?.length || 0);
    
    if (myCoursesResult.data.courses?.length > 0) {
      const courseId = myCoursesResult.data.courses[0]._id;
      console.log('First course:', myCoursesResult.data.courses[0].title);
      
      // Step 3: Get modules for this course
      console.log('\n📖 Step 3: Get modules...');
      const modulesResult = await makeRequest(`http://localhost:3000/api/courses/${courseId}/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Modules status:', modulesResult.status);
      console.log('Modules count:', modulesResult.data?.length || 0);
      
      if (modulesResult.data?.length > 0) {
        const moduleId = modulesResult.data[0]._id;
        console.log('First module:', modulesResult.data[0].title);
        
        // Step 4: Get lessons for this module
        console.log('\n📝 Step 4: Get lessons...');
        const lessonsResult = await makeRequest(`http://localhost:3000/api/courses/modules/${moduleId}/lessons`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Lessons status:', lessonsResult.status);
        console.log('Lessons count:', lessonsResult.data?.length || 0);
        
        if (lessonsResult.data?.length > 0) {
          console.log('First lesson:', lessonsResult.data[0].title);
        }
      }
      
      // Step 5: Get enrollments for this course
      console.log('\n👥 Step 5: Get enrollments...');
      const enrollmentsResult = await makeRequest(`http://localhost:3000/api/courses/${courseId}/enrollments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Enrollments status:', enrollmentsResult.status);
      console.log('Enrollments count:', enrollmentsResult.data?.students?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCourseData();
