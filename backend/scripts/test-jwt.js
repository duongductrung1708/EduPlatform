const jwt = require('jsonwebtoken');

// Test JWT token creation and verification
function testJWT() {
  const secret = process.env.JWT_SECRET || 'change_me';
  console.log('JWT Secret:', secret);
  
  // Create a test payload
  const payload = {
    sub: '507f1f77bcf86cd799439011', // Example ObjectId
    email: 'student1@example.com',
    role: 'student',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  console.log('Payload:', payload);
  
  // Create token
  const token = jwt.sign(payload, secret);
  console.log('Generated Token:', token);
  
  // Verify token
  try {
    const decoded = jwt.verify(token, secret);
    console.log('Decoded Token:', decoded);
  } catch (error) {
    console.error('Token verification failed:', error.message);
  }
}

testJWT();
