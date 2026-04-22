import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockUsers, mockReports } from '@/mockDb';

const router = Router();

// Generate JWT token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
};

// Mock Register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    console.log('Mock registration:', { email, username });

    // Check if user exists
    const existingUser = mockUsers.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      id: String(mockUsers.length + 1),
      email,
      username,
      passwordHash,
      firstName: firstName || username,
      lastName: lastName || '',
      role: 'USER',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    // Generate token
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Mock register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

// Mock Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Mock login:', { email });

    // Find user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // For test users with plain text passwords (simplified for demo)
    let isMatch = false;
    console.log('Checking password:', { 
      userPassword: user.password, 
      inputPassword: password,
      passwordMatch: user.password === password 
    });
    
    if (user.password === password) {
      isMatch = true;
      console.log('Plain text password matched');
    } else if (await bcrypt.compare(password, user.passwordHash || '')) {
      isMatch = true;
      console.log('Hashed password matched');
    } else {
      console.log('No password match found');
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if user is banned
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been banned. Please contact support.',
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// Mock Get Me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = (process.env.JWT_SECRET || 'fallback-secret') as string;
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    
    const user = mockUsers.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
});

// Mock Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
