const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...');
    
    // Test public courses endpoint
    console.log('\n📚 Testing /api/courses/public...');
    try {
      const publicRes = await axios.get('http://localhost:3000/api/courses/public');
      console.log('✅ Public courses:', publicRes.data.courses?.length || 0);
    } catch (error) {
      console.log('❌ Public courses error:', error.response?.status, error.response?.data);
    }

    // Test my-enrolled endpoint (without auth - should get 401)
    console.log('\n🎓 Testing /api/courses/my-enrolled (no auth)...');
    try {
      const enrolledRes = await axios.get('http://localhost:3000/api/courses/my-enrolled');
      console.log('✅ My enrolled:', enrolledRes.data);
    } catch (error) {
      console.log('❌ My enrolled error:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Wait a bit for server to start
setTimeout(testAPI, 3000);
