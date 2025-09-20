// Simple test to check if backend is running
const http = require('http');

function testBackend() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/courses',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Backend is running! Status: ${res.statusCode}`);
    console.log('Response headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response data:', data.substring(0, 200) + '...');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Backend is not running:', error.message);
  });

  req.end();
}

console.log('🧪 Testing if backend is running...');
testBackend();
