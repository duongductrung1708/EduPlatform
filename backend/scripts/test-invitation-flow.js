const http = require('http');

// Test the complete invitation flow
async function testInvitationFlow() {
  const courseId = '68cd41f6096b3ef01c7a9824'; // Replace with actual course ID
  const studentEmail = 'trungyna1708@gmai.com'; // Use the correct email with typo
  
  console.log('🧪 Testing invitation flow...');
  console.log('Course ID:', courseId);
  console.log('Student Email:', studentEmail);
  
  // Step 1: Login as teacher to get token
  const teacherToken = await loginAsTeacher();
  if (!teacherToken) {
    console.log('❌ Failed to login as teacher');
    return;
  }
  
  // Step 2: Create invitation
  console.log('\n📧 Step 1: Creating invitation...');
  const invitation = await createInvitation(teacherToken, courseId, studentEmail);
  if (invitation) {
    console.log('✅ Invitation created:', invitation._id);
  } else {
    console.log('❌ Failed to create invitation');
    return;
  }
  
  // Step 3: Try to create another invitation (should fail)
  console.log('\n🔄 Step 2: Trying to create duplicate invitation...');
  const duplicateInvitation = await createInvitation(teacherToken, courseId, studentEmail);
  if (duplicateInvitation) {
    console.log('❌ Duplicate invitation was created (this should not happen)');
  } else {
    console.log('✅ Duplicate invitation correctly blocked');
  }
  
  // Step 4: Login as student and accept invitation
  console.log('\n👨‍🎓 Step 3: Accepting invitation as student...');
  const studentToken = await loginAsStudent();
  if (!studentToken) {
    console.log('❌ Failed to login as student');
    return;
  }
  
  const acceptResult = await acceptInvitation(studentToken, invitation._id);
  if (acceptResult) {
    console.log('✅ Invitation accepted successfully');
  } else {
    console.log('❌ Failed to accept invitation');
    return;
  }
  
  // Step 5: Try to create invitation again (should fail - already enrolled)
  console.log('\n🚫 Step 4: Trying to invite enrolled student...');
  const enrolledInvitation = await createInvitation(teacherToken, courseId, studentEmail);
  if (enrolledInvitation) {
    console.log('❌ Invitation created for enrolled student (this should not happen)');
  } else {
    console.log('✅ Invitation correctly blocked for enrolled student');
  }
  
  // Step 6: Remove student from course
  console.log('\n🗑️ Step 5: Removing student from course...');
  const removeResult = await removeStudent(teacherToken, courseId, studentEmail);
  if (removeResult) {
    console.log('✅ Student removed from course');
  } else {
    console.log('❌ Failed to remove student');
    return;
  }
  
  // Step 7: Try to create invitation again (should work now)
  console.log('\n🔄 Step 6: Trying to invite removed student again...');
  const newInvitation = await createInvitation(teacherToken, courseId, studentEmail);
  if (newInvitation) {
    console.log('✅ New invitation created for removed student');
  } else {
    console.log('❌ Failed to create invitation for removed student');
  }
  
  console.log('\n🎉 Test completed!');
}

async function loginAsTeacher() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'teacher@example.com', // Replace with actual teacher email
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.accessToken);
        } else {
          console.log('Teacher login failed:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Teacher login request failed:', error.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function loginAsStudent() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'trungyna1708@gmai.com', // Use the correct email with typo
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.accessToken);
        } else {
          console.log('Student login failed:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Student login request failed:', error.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function createInvitation(token, courseId, studentEmail) {
  return new Promise((resolve) => {
    const invitationData = JSON.stringify({
      courseId: courseId,
      studentEmail: studentEmail,
      message: 'Test invitation message'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/course-invitations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(invitationData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          const response = JSON.parse(data);
          resolve(response);
        } else {
          console.log('Create invitation failed:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Create invitation request failed:', error.message);
      resolve(null);
    });

    req.write(invitationData);
    req.end();
  });
}

async function acceptInvitation(token, invitationId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/course-invitations/${invitationId}/accept`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response);
        } else {
          console.log('Accept invitation failed:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Accept invitation request failed:', error.message);
      resolve(null);
    });

    req.end();
  });
}

async function removeStudent(token, courseId, studentEmail) {
  return new Promise((resolve) => {
    // This would need to be implemented based on your remove student API
    // For now, just return true as a placeholder
    console.log('Note: Remove student API not implemented in this test');
    resolve(true);
  });
}

// Wait for server to start, then run test
setTimeout(() => {
  testInvitationFlow();
}, 5000);
