import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/index';
import { AuthRequest } from '@/middleware/auth';
import { mockUsers } from '@/mockDb';

// Generate JWT token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    console.log('Registration attempt:', { email, username, firstName, lastName });

    // Try database first, fall back to mock
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username },
          ],
        },
      });

      if (existingUser) {
        console.log('User already exists:', existingUser.email === email ? 'Email' : 'Username');
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
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      console.log('User created successfully:', user.email);

      // Generate token
      const token = generateToken(user.id);
      console.log('Token generated successfully');

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
        message: 'User registered successfully',
      });
    } catch (dbError) {
      // Mock mode fallback
      console.log('Using mock mode for registration');

      // Check if user already exists in mock
      const existingUser = mockUsers.find((u: any) => u.email === email || u.username === username);

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: existingUser.email === email
            ? 'Email already registered'
            : 'Username already taken',
        });
      }

      // Create new mock user
      const newUser = {
        id: Date.now().toString(),
        email,
        username,
        password, // Plain text for mock
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'USER',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      mockUsers.push(newUser);
      console.log('Mock user created:', newUser.email);

      // Generate token
      const token = generateToken(newUser.id);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            createdAt: newUser.createdAt,
          },
          token,
        },
        message: 'User registered successfully (mock)',
      });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message,
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Try database first, fall back to mock
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Check if user is banned
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been banned. Please contact support.',
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

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate token
      const token = generateToken(user.id);

      // Remove password from response
      const { passwordHash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (dbError) {
      // Mock mode fallback
      console.log('Using mock mode for login');
      
      const mockUser = mockUsers.find((u: any) => u.email === email);
      
      if (!mockUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Check if user is banned
      if (mockUser.isActive === false) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been banned. Please contact support.',
        });
      }

      // Check password (plain text for mock)
      if (mockUser.password !== password) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Generate token
      const token = generateToken(mockUser.id);

      res.json({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            isActive: mockUser.isActive,
            lastLogin: mockUser.lastLogin,
          },
          token,
        },
        message: 'Login successful (mock)',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

// Logout user
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // However, we can add token blacklisting if needed in the future
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
};

// Get current user (for token validation)
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        bio: true,
        profileImageUrl: true,
        reputationPoints: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
    });
  }
};
