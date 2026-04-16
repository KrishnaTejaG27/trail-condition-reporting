const http = require('http');

// Test data
const testUser = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'TestPass123',
  firstName: 'Test',
  lastName: 'User'
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAuthEndpoints() {
  try {
    console.log('Testing Authentication Endpoints...\n');

    // Test 1: Register endpoint
    console.log('1. Testing POST /api/auth/register');
    const registerOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const registerResponse = await makeRequest(registerOptions, testUser);
    console.log(`Status: ${registerResponse.statusCode}`);
    console.log(`Response: ${registerResponse.body}\n`);

    if (registerResponse.statusCode === 201) {
      const registerData = JSON.parse(registerResponse.body);
      const token = registerData.data.token;

      // Test 2: Login endpoint
      console.log('2. Testing POST /api/auth/login');
      const loginOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const loginResponse = await makeRequest(loginOptions, loginData);
      console.log(`Status: ${loginResponse.statusCode}`);
      console.log(`Response: ${loginResponse.body}\n`);

      if (loginResponse.statusCode === 200) {
        const loginResult = JSON.parse(loginResponse.body);
        const loginToken = loginResult.data.token;

        // Test 3: Get current user
        console.log('3. Testing GET /api/auth/me');
        const meOptions = {
          hostname: 'localhost',
          port: 3001,
          path: '/api/auth/me',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginToken}`,
            'Content-Type': 'application/json'
          }
        };

        const meResponse = await makeRequest(meOptions);
        console.log(`Status: ${meResponse.statusCode}`);
        console.log(`Response: ${meResponse.body}\n`);

        // Test 4: Logout endpoint
        console.log('4. Testing POST /api/auth/logout');
        const logoutOptions = {
          hostname: 'localhost',
          port: 3001,
          path: '/api/auth/logout',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loginToken}`,
            'Content-Type': 'application/json'
          }
        };

        const logoutResponse = await makeRequest(logoutOptions);
        console.log(`Status: ${logoutResponse.statusCode}`);
        console.log(`Response: ${logoutResponse.body}\n`);
      }
    }

    console.log('✅ Authentication endpoint tests completed!');

  } catch (error) {
    console.error('❌ Auth endpoint test failed:', error.message);
  }
}

testAuthEndpoints();
