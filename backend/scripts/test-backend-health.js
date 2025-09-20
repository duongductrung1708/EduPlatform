const http = require('http');

function testBackendHealth() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('🏥 Testing backend health...');

  const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`📡 Health Check Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Backend is healthy!');
      } else {
        console.log(`❌ Backend returned status ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Backend health check failed:', error.message);
    console.log('\n🔧 Backend server is not running on port 3001');
    console.log('Please start the backend server with: npm run start:dev');
  });

  req.end();
}

testBackendHealth();
