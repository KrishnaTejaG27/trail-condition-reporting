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

// Storage for new users
let users = [testUser];
let userIdCounter = 2;

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

  // Registration endpoint
  if (url === '/api/auth/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const registerData = JSON.parse(body);
        console.log('Registration attempt:', registerData.email);

        // Check if user already exists
        const existingUser = users.find(u => u.email === registerData.email || u.username === registerData.username);
        if (existingUser) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: existingUser.email === registerData.email ? 'Email already registered' : 'Username already taken'
          }));
          return;
        }

        // Create new user
        const newUser = {
          id: `user_${userIdCounter++}`,
          email: registerData.email,
          username: registerData.username,
          password: registerData.password, // In real app, this would be hashed
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          role: 'USER'
        };

        users.push(newUser);
        const token = 'mock-jwt-token-' + Date.now();
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            user: {
              id: newUser.id,
              email: newUser.email,
              username: newUser.username,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              role: newUser.role
            },
            token: token
          },
          message: 'User registered successfully'
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid request data'
        }));
      }
    });
  }
  // Login endpoint
  else if (url === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const loginData = JSON.parse(body);
        console.log('Login attempt:', loginData.email);

        // Find user in users array
        const user = users.find(u => u.email === loginData.email && u.password === loginData.password);
        if (user) {
          const token = 'mock-jwt-token-' + Date.now();
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            data: {
              user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
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
