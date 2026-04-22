import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest } from '@/middleware/auth';
import { mockUsers, updateUser } from '@/mockDb';

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
    const { firstName, lastName, bio, preferences, profileImageUrl } = req.body;
    
    // Try database first, fall back to mock
    try {
      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          firstName: firstName !== undefined ? firstName : undefined,
          lastName: lastName !== undefined ? lastName : undefined,
          bio: bio !== undefined ? bio : undefined,
          preferences: preferences !== undefined ? preferences : undefined,
          profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : undefined,
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
    } catch (dbError) {
      // Database not available, use mock mode
      console.log('Using mock mode for profile update');
      
      // Check if user exists
      const mockUser = mockUsers.find(u => u.id === req.user!.id);
      if (!mockUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Update mock user using updateUser function (saves to file)
      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (bio !== undefined) updates.bio = bio;
      if (profileImageUrl !== undefined) updates.profileImageUrl = profileImageUrl;
      updates.updatedAt = new Date().toISOString();
      
      const updatedUser = updateUser(req.user!.id, updates);

      const user = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        bio: updatedUser.bio,
        profileImageUrl: updatedUser.profileImageUrl,
        reputationPoints: updatedUser.reputationPoints || 0,
        preferences: updatedUser.preferences,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
      };

      res.json({
        success: true,
        data: { user },
        message: 'Profile updated successfully (mock)',
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};
