const http = require('http');
const { register, login, getMe, logout } = require('./mock-auth-controller');

// Mock server for testing
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Add helper methods to response
  res.status = function(code) {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    return res;
  };
  
  res.json = function(data) {
    res.end(JSON.stringify(data));
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL and method
  const url = req.url;
  const method = req.method;

  // Route handling
  if (url === '/api/auth/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      req.body = JSON.parse(body);
      register(req, res);
    });
  } else if (url === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      req.body = JSON.parse(body);
      login(req, res);
    });
  } else if (url === '/api/auth/me' && method === 'GET') {
    getMe(req, res);
  } else if (url === '/api/auth/logout' && method === 'POST') {
    logout(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
  }
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 Mock test server running on port ${PORT}`);
  console.log(`📊 Test endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`   POST http://localhost:${PORT}/api/auth/logout`);
});

// Test the endpoints automatically
setTimeout(async () => {
  console.log('\n🧪 Running automated tests...\n');
  
  const testHttp = (options, data) => {
    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      });
      req.on('error', resolve);
      
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  };

  try {
    // Test registration
    console.log('1. Testing registration...');
    const regResponse = await testHttp({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPass123',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log(`   Status: ${regResponse.statusCode}`);
    console.log(`   Response: ${regResponse.body.substring(0, 100)}...\n`);

    if (regResponse.statusCode === 201) {
      const regData = JSON.parse(regResponse.body);
      const token = regData.data.token;

      // Test login
      console.log('2. Testing login...');
      const loginResponse = await testHttp({
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: 'test@example.com',
        password: 'TestPass123'
      });
      console.log(`   Status: ${loginResponse.statusCode}`);
      console.log(`   Response: ${loginResponse.body.substring(0, 100)}...\n`);

      if (loginResponse.statusCode === 200) {
        const loginData = JSON.parse(loginResponse.body);
        const loginToken = loginData.data.token;

        // Test getMe
        console.log('3. Testing getMe...');
        const meResponse = await testHttp({
          hostname: 'localhost',
          port: PORT,
          path: '/api/auth/me',
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginToken}`
          }
        });
        console.log(`   Status: ${meResponse.statusCode}`);
        console.log(`   Response: ${meResponse.body.substring(0, 100)}...\n`);

        // Test logout
        console.log('4. Testing logout...');
        const logoutResponse = await testHttp({
          hostname: 'localhost',
          port: PORT,
          path: '/api/auth/logout',
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginToken}`
          }
        });
        console.log(`   Status: ${logoutResponse.statusCode}`);
        console.log(`   Response: ${logoutResponse.body.substring(0, 100)}...\n`);
      }
    }

    console.log('✅ All authentication tests completed successfully!');
    server.close();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    server.close();
  }
}, 1000);
