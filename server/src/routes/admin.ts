import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { prisma } from '@/index';
import { mockReports, mockUsers, updateUser as updateUserInMock, deleteReport as deleteReportFromMock } from '@/mockDb';

const router = Router();

// All admin routes require authentication
router.use(protect);

const checkAdminRole = (req: any, res: any, next: any) => {
  const userRole = req.user?.role;
  if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }
  next();
};

router.use(checkAdminRole);

/**
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Try database first
    try {
      const [
        totalUsers,
        totalReports,
        activeReports,
        resolvedReports,
        reportsThisWeek,
        reportsThisMonth
      ] = await Promise.all([
        prisma.user.count(),
        prisma.report.count(),
        prisma.report.count({ where: { isResolved: false } }),
        prisma.report.count({ where: { isResolved: true } }),
        prisma.report.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }),
        prisma.report.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        })
      ]);

      return res.json({
        success: true,
        data: {
          totalUsers,
          totalReports,
          activeReports,
          resolvedReports,
          reportsThisWeek,
          reportsThisMonth,
          resolutionRate: totalReports > 0 ? (resolvedReports / totalReports * 100).toFixed(1) : 0
        }
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for admin stats');
      
      const totalReports = mockReports.length;
      const resolvedReports = mockReports.filter(r => r.isResolved).length;
      const activeReports = totalReports - resolvedReports;
      
      return res.json({
        success: true,
        data: {
          totalUsers: mockUsers.length,
          totalReports,
          activeReports,
          resolvedReports,
          reportsThisWeek: Math.floor(totalReports * 0.3),
          reportsThisMonth: Math.floor(totalReports * 0.7),
          resolutionRate: totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(1) : 0
        },
        message: 'Stats fetched (mock)'
      });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats' 
    });
  }
});

/**
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    // Try database first
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { reports: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: { 
          users: users.map(u => ({
            ...u,
            reports_count: u._count.reports
          }))
        }
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for users');
      
      return res.json({
        success: true,
        data: { 
          users: mockUsers.map(u => ({
            ...u,
            reports_count: mockReports.filter(r => r.userId === u.id).length
          }))
        },
        message: 'Users fetched (mock)'
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users' 
    });
  }
});

/**
 * Get all reports (admin view)
 */
router.get('/reports', async (req, res) => {
  try {
    // Try database first
    try {
      const reports = await prisma.report.findMany({
        include: {
          user: { select: { username: true, email: true } },
          trail: { select: { name: true } },
          _count: { select: { votes: true, comments: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: { reports }
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for reports');
      
      const enrichedReports = mockReports.map(r => {
        const user = mockUsers.find(u => u.id === r.userId);
        return {
          ...r,
          user: user ? { username: user.username, email: user.email } : null,
          trail: { name: 'Mock Trail' },
          _count: {
            votes: 0,
            comments: 0
          }
        };
      });

      return res.json({
        success: true,
        data: { reports: enrichedReports },
        message: 'Reports fetched (mock)'
      });
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch reports' 
    });
  }
});

/**
 * Ban/unban user
 */
router.post('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try database first
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      return res.json({
        success: true,
        data: { user },
        message: 'User banned successfully'
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for ban user');
      
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      mockUsers[userIndex] = { ...mockUsers[userIndex], isActive: false };
      updateUserInMock(id, { isActive: false });

      return res.json({
        success: true,
        data: { user: mockUsers[userIndex] },
        message: 'User banned (mock)'
      });
    }
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to ban user' 
    });
  }
});

/**
 * Flag report
 */
router.put('/reports/:id/flag', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try database first
    try {
      const report = await prisma.report.update({
        where: { id },
        data: { status: 'flagged' }
      });

      return res.json({
        success: true,
        data: { report },
        message: 'Report flagged for review'
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for flag report');
      
      const reportIndex = mockReports.findIndex(r => r.id === id);
      if (reportIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      mockReports[reportIndex] = { ...mockReports[reportIndex], status: 'flagged' };

      return res.json({
        success: true,
        data: { report: mockReports[reportIndex] },
        message: 'Report flagged (mock)'
      });
    }
  } catch (error) {
    console.error('Error flagging report:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to flag report' 
    });
  }
});

/**
 * Resolve report (admin can resolve any report)
 */
router.put('/reports/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    
    // Try database first
    try {
      const report = await prisma.report.update({
        where: { id },
        data: { 
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: adminId
        }
      });

      return res.json({
        success: true,
        data: { report },
        message: 'Report marked as resolved'
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for resolve report');
      
      const reportIndex = mockReports.findIndex(r => r.id === id);
      if (reportIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      mockReports[reportIndex] = { 
        ...mockReports[reportIndex], 
        isResolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy: adminId
      };

      return res.json({
        success: true,
        data: { report: mockReports[reportIndex] },
        message: 'Report resolved (mock)'
      });
    }
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to resolve report' 
    });
  }
});

/**
 * Remove report
 */
router.delete('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try database first
    try {
      await prisma.report.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Report removed successfully'
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for remove report');
      
      const deleted = deleteReportFromMock(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }

      return res.json({
        success: true,
        message: 'Report removed (mock)'
      });
    }
  } catch (error) {
    console.error('Error removing report:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to remove report' 
    });
  }
});

/**
 * Get user details
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try database first
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          reputationPoints: true,
          profileImageUrl: true,
          _count: { select: { reports: true } }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: { user }
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for user details');
      
      const user = mockUsers.find(u => u.id === id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: { 
          user: {
            ...user,
            _count: { reports: mockReports.filter(r => r.userId === id).length }
          }
        },
        message: 'User fetched (mock)'
      });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user' 
    });
  }
});

/**
 * Get user's reports
 */
router.get('/users/:id/reports', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try database first
    try {
      const reports = await prisma.report.findMany({
        where: { userId: id },
        include: {
          _count: { select: { votes: true, comments: true } },
          photos: { select: { id: true, url: true, thumbnailUrl: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: { reports }
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for user reports');
      
      const userReports = mockReports.filter(r => r.userId === id);
      
      return res.json({
        success: true,
        data: { 
          reports: userReports.map(r => ({
            ...r,
            _count: { votes: 0, comments: 0 },
            photos: []
          }))
        },
        message: 'Reports fetched (mock)'
      });
    }
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user reports' 
    });
  }
});

export default router;
