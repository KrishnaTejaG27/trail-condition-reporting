const http = require('http');

// Simple test user
const testUser = {
  email: 'test@example.com',
  password: 'TestPass123',
  id: 'user_1',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL and method
  const url = req.url;
  const method = req.method;

  // Login endpoint
  if (url === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const loginData = JSON.parse(body);
        console.log('Login attempt:', loginData.email);

        // Simple validation
        if (loginData.email === testUser.email && loginData.password === testUser.password) {
          const token = 'mock-jwt-token-' + Date.now();
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            data: {
              user: {
                id: testUser.id,
                email: testUser.email,
                username: testUser.username,
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                role: 'USER'
              },
              token: token
            },
            message: 'Login successful'
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid credentials'
          }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid request data'
        }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Endpoint not found'
    }));
  }
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 Simple Auth Server running on port ${PORT}`);
  console.log(`📊 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`👤 Test credentials:`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Password: ${testUser.password}`);
  console.log(`\n✅ Server ready for testing!`);
});
