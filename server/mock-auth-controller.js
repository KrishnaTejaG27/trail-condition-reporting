const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock user storage (in-memory for testing)
let users = [];
let userIdCounter = 1;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Mock register endpoint
const register = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    console.log('Mock Registration attempt:', { email, username, firstName, lastName });

    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create user
    const user = {
      id: `user_${userIdCounter++}`,
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      role: 'USER',
      createdAt: new Date().toISOString(),
    };
    
    users.push(user);
    console.log('User created successfully:', user.email);

    // Generate token
    const token = generateToken(user.id);
    console.log('Token generated successfully');

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Mock Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message,
    });
  }
};

// Mock login endpoint
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Mock Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message,
    });
  }
};

// Mock getMe endpoint
const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: { user: userWithoutPassword },
    });
  } catch (error) {
    console.error('Mock GetMe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
      details: error.message,
    });
  }
};

// Mock logout endpoint
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Mock Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      details: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  users // Export for testing
};
