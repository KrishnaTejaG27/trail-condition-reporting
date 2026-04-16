import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { prisma } from '@/index';

const router = Router();

// All analytics routes require authentication and admin/moderator role
router.use(protect);

const checkAdminRole = (req: any, res: any, next: any) => {
  const userRole = req.user?.role;
  if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(checkAdminRole);

/**
 * Get overall dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalReports,
      totalTrails,
      totalParks,
      activeReports,
      resolvedReports,
      reportsThisWeek,
      reportsThisMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.report.count(),
      prisma.trail.count(),
      prisma.park.count(),
      prisma.report.count({ where: { isResolved: false } }),
      prisma.report.count({ where: { isResolved: true } }),
      prisma.report.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.report.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      totalUsers,
      totalReports,
      totalTrails,
      totalParks,
      activeReports,
      resolvedReports,
      reportsThisWeek,
      reportsThisMonth,
      resolutionRate: totalReports > 0 ? (resolvedReports / totalReports * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * Get reports by severity level
 */
router.get('/reports-by-severity', async (req, res) => {
  try {
    const reports = await prisma.report.groupBy({
      by: ['severityLevel'],
      _count: {
        id: true
      }
    });

    const severityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    reports.forEach(report => {
      severityCounts[report.severityLevel] = report._count.id;
    });

    res.json(severityCounts);
  } catch (error) {
    console.error('Error fetching severity stats:', error);
    res.status(500).json({ error: 'Failed to fetch severity statistics' });
  }
});

/**
 * Get reports by condition type
 */
router.get('/reports-by-condition', async (req, res) => {
  try {
    const reports = await prisma.report.groupBy({
      by: ['conditionType'],
      _count: {
        id: true
      }
    });

    const conditionCounts = {};
    reports.forEach(report => {
      conditionCounts[report.conditionType] = report._count.id;
    });

    res.json(conditionCounts);
  } catch (error) {
    console.error('Error fetching condition stats:', error);
    res.status(500).json({ error: 'Failed to fetch condition statistics' });
  }
});

/**
 * Get reports over time (last 30 days)
 */
router.get('/reports-over-time', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const reports = await prisma.report.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by date
    const reportsByDate = {};
    reports.forEach(report => {
      const date = report.createdAt.toISOString().split('T')[0];
      reportsByDate[date] = (reportsByDate[date] || 0) + 1;
    });

    res.json(reportsByDate);
  } catch (error) {
    console.error('Error fetching time series data:', error);
    res.status(500).json({ error: 'Failed to fetch time series data' });
  }
});

/**
 * Get top contributors
 */
router.get('/top-contributors', async (req, res) => {
  try {
    const contributors = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        reputationPoints: true,
        _count: {
          select: {
            reports: true
          }
        }
      },
      orderBy: {
        reputationPoints: 'desc'
      },
      take: 10
    });

    res.json(contributors);
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    res.status(500).json({ error: 'Failed to fetch top contributors' });
  }
});

/**
 * Get recent activity
 */
router.get('/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const [recentReports, recentUsers] = await Promise.all([
      prisma.report.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              username: true
            }
          },
          trail: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.user.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      recentReports,
      recentUsers
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

/**
 * Get park statistics
 */
router.get('/park-statistics', async (req, res) => {
  try {
    const parks = await prisma.park.findMany({
      include: {
        _count: {
          select: {
            trails: true,
            alerts: true
          }
        },
        trails: {
          include: {
            _count: {
              select: {
                reports: true
              }
            }
          }
        }
      }
    });

    const parkStats = parks.map(park => ({
      id: park.id,
      name: park.name,
      trailCount: park._count.trails,
      alertCount: park._count.alerts,
      totalReports: park.trails.reduce((sum, trail) => sum + trail._count.reports, 0)
    }));

    res.json(parkStats);
  } catch (error) {
    console.error('Error fetching park statistics:', error);
    res.status(500).json({ error: 'Failed to fetch park statistics' });
  }
});

export default router;
