import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/index';
import { mockUsers } from '@/mockDb';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('Auth middleware: No token provided');
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }

  console.log('Auth middleware: Token received, length:', token.length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    console.log('Auth middleware: Token verified, userId:', decoded.id);
    
    // Try to find user in database first, fall back to mock users
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
        },
      });
    } catch (dbError) {
      console.log('Database error in auth, will try mock users');
    }
    
    // If not found in DB or DB error, try mock users
    if (!user) {
      const mockUser = mockUsers.find((u: any) => u.id === decoded.id);
      if (mockUser) {
        user = {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          role: mockUser.role,
          isActive: mockUser.isActive ?? true,
        };
        console.log('Auth middleware: Using mock user');
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token or user not found.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. User not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};
