import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest } from '@/middleware/auth';

// Get user profile
export const getProfile = async (req: AuthRequest, res: Response) => {
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
        preferences: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            reports: true,
            comments: true,
            votes: true,
          },
        },
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, bio, preferences } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        bio: bio !== undefined ? bio : undefined,
        preferences: preferences !== undefined ? preferences : undefined,
      },
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
        preferences: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    res.json({
      success: true,
      data: { user },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};
