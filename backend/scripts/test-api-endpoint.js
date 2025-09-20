const axios = require('axios');

async function testApiEndpoint() {
  try {
    console.log('🧪 Testing API endpoint...');
    
    // Test data
    const courseId = '68cd41f6096b3ef01c7a9824';
    const studentEmail = 'trungyna1708@gmail.com';
    
    // First, let's try to login to get a token
    console.log('\n1. Attempting to login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'trungyna1708@gmail.com', // Try with the same email
      password: 'password123' // Common password
    });
    
    console.log('✅ Login successful!');
    const token = loginResponse.data.accessToken;
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Now test the add student endpoint
    console.log('\n2. Testing add student endpoint...');
    const response = await axios.post(
      `http://localhost:3001/api/courses/${courseId}/enrollments`,
      { studentEmail },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Authentication failed. Let\'s try with different credentials...');
      
      // Try with admin credentials
      try {
        const adminLogin = await axios.post('http://localhost:3001/api/auth/login', {
          email: 'admin@example.com',
          password: 'admin123'
        });
        
        console.log('✅ Admin login successful!');
        const adminToken = adminLogin.data.accessToken;
        
        // Test with admin token
        const adminResponse = await axios.post(
          `http://localhost:3001/api/courses/${courseId}/enrollments`,
          { studentEmail: 'trungyna1708@gmail.com' },
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Admin test success:', adminResponse.data);
      } catch (adminError) {
        console.error('❌ Admin test failed:', adminError.response?.data || adminError.message);
      }
    }
  }
}

testApiEndpoint();
