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

async function testTeacherAPIs() {
  try {
    console.log('🧪 Testing Teacher APIs...');
    
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
    
    // Step 2: Test get my courses
    console.log('\n📚 Step 2: Test /api/courses/my-courses...');
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
      
      // Step 3: Test get modules
      console.log('\n📖 Step 3: Test /api/courses/:id/modules...');
      const modulesResult = await makeRequest(`http://localhost:3000/api/courses/${courseId}/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Status:', modulesResult.status);
      console.log('Modules count:', modulesResult.data?.length || 0);
      
      // Step 4: Test create module
      console.log('\n➕ Step 4: Test create module...');
      const createModuleResult = await makeRequest(`http://localhost:3000/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: {
          title: 'Module Test',
          description: 'Module được tạo từ API test',
          order: 1,
          estimatedDuration: 60,
          isPublished: true
        }
      });
      
      console.log('Create module status:', createModuleResult.status);
      console.log('Create module result:', createModuleResult.data);
      
      if (createModuleResult.status === 201 || createModuleResult.status === 200) {
        const moduleId = createModuleResult.data._id;
        console.log('Created module ID:', moduleId);
        
        // Step 5: Test create lesson
        console.log('\n📝 Step 5: Test create lesson...');
        const createLessonResult = await makeRequest(`http://localhost:3000/api/courses/modules/${moduleId}/lessons`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: {
            title: 'Bài học Test',
            description: 'Bài học được tạo từ API test',
            type: 'document',
            order: 1,
            estimatedDuration: 30,
            isPublished: true
          }
        });
        
        console.log('Create lesson status:', createLessonResult.status);
        console.log('Create lesson result:', createLessonResult.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testTeacherAPIs();
