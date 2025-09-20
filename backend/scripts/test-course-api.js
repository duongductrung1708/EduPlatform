const http = require('http');

function testCourseAPI() {
  const courseId = '68cd41f6096b3ef01c7a9824';
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/courses/${courseId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log(`🧪 Testing course API: GET /api/courses/${courseId}`);
  console.log('Options:', options);

  const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`\n📡 Response Status: ${res.statusCode}`);
    console.log('Response Headers:', res.headers);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📄 Response Body:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log(data);
      }
      
      if (res.statusCode === 200) {
        console.log('\n✅ Course API is working!');
      } else {
        console.log(`\n❌ Course API returned status ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('1. Backend server is not running on port 3001');
    console.log('2. Course ID does not exist in database');
    console.log('3. Database connection issues');
  });

  req.end();
}

testCourseAPI();
