const axios = require('axios');

async function testAddStudent() {
  try {
    console.log('🧪 Testing add student API...');
    
    // Test data
    const courseId = '68cd41f6096b3ef01c7a9824';
    const studentEmail = 'student@example.com'; // Change this to a real student email
    
    // You'll need to get a valid JWT token first
    const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token
    
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
  }
}

testAddStudent();
