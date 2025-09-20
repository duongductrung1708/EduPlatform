// Update email through API
const http = require('http');

function updateEmail() {
  // First, login to get token
  const loginData = JSON.stringify({
    email: 'trungyna1708@gmai.com', // Use the typo email to login
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        const token = response.accessToken;
        console.log('✅ Login successful!');
        
        // Now update email
        updateUserEmail(token);
      } else {
        console.log('❌ Login failed:', data);
      }
    });
  });

  loginReq.on('error', (error) => {
    console.error('❌ Login request failed:', error.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}

function updateUserEmail(token) {
  const updateData = JSON.stringify({
    email: 'trungyna1708@gmail.com' // Correct email
  });

  const updateOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/users/profile',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(updateData)
    }
  };

  const updateReq = http.request(updateOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Email updated successfully!');
        console.log('Response:', data);
      } else {
        console.log('❌ Email update failed:', data);
      }
    });
  });

  updateReq.on('error', (error) => {
    console.error('❌ Update request failed:', error.message);
  });

  updateReq.write(updateData);
  updateReq.end();
}

console.log('🧪 Updating email from gmai.com to gmail.com...');
updateEmail();
