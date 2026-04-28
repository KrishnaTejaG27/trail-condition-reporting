import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { prisma } from '@/index';
import { mockReports, mockUsers, mockVotes, mockComments } from '@/mockDb';

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

// Log all analytics requests
router.use((req, res, next) => {
  console.log('Analytics request:', req.method, req.path);
  next();
});

/**
 * Get overall dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    let totalUsers, totalReports, totalTrails, totalParks, activeReports, resolvedReports, reportsThisWeek, reportsThisMonth;

    // Check if database is available
    const hasDatabase = !!process.env.DATABASE_URL;
    console.log('DATABASE_URL check:', process.env.DATABASE_URL, 'hasDatabase:', hasDatabase);
    
    if (!hasDatabase) {
      console.log('No DATABASE_URL, using mock data for dashboard');
      // Use mock data
      totalUsers = mockUsers.length;
      totalReports = mockReports.length;
      totalTrails = 0;
      totalParks = 0;
      activeReports = mockReports.filter(r => !r.isResolved).length;
      resolvedReports = mockReports.filter(r => r.isResolved).length;
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      reportsThisWeek = mockReports.filter(r => new Date(r.createdAt) >= oneWeekAgo).length;
      reportsThisMonth = mockReports.filter(r => new Date(r.createdAt) >= oneMonthAgo).length;
    } else {
      console.log('DATABASE_URL found, trying database');
      // Try to fetch from database
      try {
        totalUsers = await prisma.user.count();
      } catch (e) {
        console.log('Failed to get users from DB, using mock');
        totalUsers = mockUsers.length;
      }

      try {
        totalReports = await prisma.report.count();
      } catch (e) {
        console.log('Failed to get reports from DB, using mock');
        totalReports = mockReports.length;
      }

      try {
        totalTrails = await prisma.trail.count();
      } catch (e) {
        totalTrails = 0;
      }

      try {
        totalParks = await prisma.park.count();
      } catch (e) {
        totalParks = 0;
      }

      try {
        activeReports = await prisma.report.count({ where: { isResolved: false } });
      } catch (e) {
        activeReports = mockReports.filter(r => !r.isResolved).length;
      }

      try {
        resolvedReports = await prisma.report.count({ where: { isResolved: true } });
      } catch (e) {
        resolvedReports = mockReports.filter(r => r.isResolved).length;
      }

      try {
        reportsThisWeek = await prisma.report.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        });
      } catch (e) {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        reportsThisWeek = mockReports.filter(r => new Date(r.createdAt) >= oneWeekAgo).length;
      }

      try {
        reportsThisMonth = await prisma.report.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        });
      } catch (e) {
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        reportsThisMonth = mockReports.filter(r => new Date(r.createdAt) >= oneMonthAgo).length;
      }
    }

    console.log('Dashboard stats returning:', { totalUsers, totalReports, activeReports });
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
    const hasDatabase = !!process.env.DATABASE_URL;
    let reports;

    if (!hasDatabase) {
      console.log('No DATABASE_URL, using mock data for severity stats');
      // Use mock data
      reports = mockReports.reduce((acc: any, report: any) => {
        const severity = report.severityLevel || 'LOW';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});
      reports = Object.entries(reports).map(([severityLevel, count]) => ({
        severityLevel,
        _count: { id: count as number }
      }));
    } else {
      try {
        reports = await prisma.report.groupBy({
          by: ['severityLevel'],
          _count: {
            id: true
          }
        });
      } catch (dbError) {
        console.log('Database error, using mock data for severity stats');
        // Use mock data
        reports = mockReports.reduce((acc: any, report: any) => {
          const severity = report.severityLevel || 'LOW';
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {});
        reports = Object.entries(reports).map(([severityLevel, count]) => ({
          severityLevel,
          _count: { id: count as number }
        }));
      }
    }

    const severityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    reports.forEach((report: any) => {
      severityCounts[report.severityLevel] = report._count.id;
    });

    console.log('Severity stats returning:', severityCounts);
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
    const hasDatabase = !!process.env.DATABASE_URL;
    let reports;

    if (!hasDatabase) {
      console.log('No DATABASE_URL, using mock data for condition stats');
      // Use mock data
      reports = mockReports.reduce((acc: any, report: any) => {
        const condition = report.conditionType || 'UNKNOWN';
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
      }, {});
      reports = Object.entries(reports).map(([conditionType, count]) => ({
        conditionType,
        _count: { id: count as number }
      }));
    } else {
      try {
        reports = await prisma.report.groupBy({
          by: ['conditionType'],
          _count: {
            id: true
          }
        });
      } catch (dbError) {
        console.log('Database error, using mock data for condition stats');
        // Use mock data
        reports = mockReports.reduce((acc: any, report: any) => {
          const condition = report.conditionType || 'UNKNOWN';
          acc[condition] = (acc[condition] || 0) + 1;
          return acc;
        }, {});
        reports = Object.entries(reports).map(([conditionType, count]) => ({
          conditionType,
          _count: { id: count as number }
        }));
      }
    }

    const conditionCounts = {};
    reports.forEach((report: any) => {
      conditionCounts[report.conditionType] = report._count.id;
    });

    console.log('Condition stats returning:', conditionCounts);
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
    const hasDatabase = !!process.env.DATABASE_URL;
    let reports;

    if (!hasDatabase) {
      console.log('No DATABASE_URL, using mock data for time series');
      // Use mock data
      reports = mockReports
        .filter(r => new Date(r.createdAt) >= thirtyDaysAgo)
        .map(r => ({ createdAt: new Date(r.createdAt) }));
    } else {
      try {
        reports = await prisma.report.findMany({
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
      } catch (dbError) {
        console.log('Database error, using mock data for time series');
        // Use mock data
        reports = mockReports
          .filter(r => new Date(r.createdAt) >= thirtyDaysAgo)
          .map(r => ({ createdAt: new Date(r.createdAt) }));
      }
    }

    // Group by date
    const reportsByDate = {};
    reports.forEach((report: any) => {
      const date = report.createdAt.toISOString().split('T')[0];
      reportsByDate[date] = (reportsByDate[date] || 0) + 1;
    });

    console.log('Time series returning:', Object.keys(reportsByDate).length, 'days');
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
    const hasDatabase = !!process.env.DATABASE_URL;
    let contributors;

    if (!hasDatabase) {
      console.log('No DATABASE_URL, using mock data for top contributors');
      // Use mock data - calculate reputation points matching profile formula
      const userReportCounts = mockReports.reduce((acc: any, report: any) => {
        acc[report.userId] = (acc[report.userId] || 0) + 1;
        return acc;
      }, {});
      
      // Count votes on each user's reports
      const userVoteCounts = mockUsers.map((user: any) => {
        const userReports = mockReports.filter((r: any) => r.userId === user.id);
        const voteCount = mockVotes.filter((v: any) => 
          userReports.some((r: any) => r.id === v.reportId)
        ).length;
        return { userId: user.id, voteCount };
      });
      
      // Count comments made by each user
      const userCommentCounts = mockUsers.map((user: any) => {
        const commentCount = mockComments.filter((c: any) => c.userId === user.id).length;
        return { userId: user.id, commentCount };
      });
      
      contributors = mockUsers.map((user: any) => {
        const reportCount = userReportCounts[user.id] || 0;
        const voteCount = userVoteCounts.find((u: any) => u.userId === user.id)?.voteCount || 0;
        const commentCount = userCommentCounts.find((u: any) => u.userId === user.id)?.commentCount || 0;
        // Match profile calculation: reports * 10 + votes * 2 + comments
        const calculatedPoints = reportCount * 10 + voteCount * 2 + commentCount;
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          reputationPoints: calculatedPoints,
          _count: {
            reports: reportCount
          }
        };
      }).sort((a: any, b: any) => b.reputationPoints - a.reputationPoints).slice(0, 10);
    } else {
      try {
        // Calculate reputation dynamically to match profile calculation
        const users = await prisma.user.findMany({
          take: 10,
        });
        
        contributors = await Promise.all(
          users.map(async (user) => {
            const [reportsCount, totalVotesOnReports, commentsMade] = await Promise.all([
              prisma.report.count({ where: { userId: user.id } }),
              prisma.vote.count({ 
                where: { 
                  report: { userId: user.id } 
                } 
              }),
              prisma.comment.count({ where: { userId: user.id } })
            ]);
            
            const calculatedReputation = reportsCount * 10 + totalVotesOnReports * 2 + commentsMade;
            console.log(`Analytics for user ${user.id}: reports=${reportsCount}, votes=${totalVotesOnReports}, comments=${commentsMade}, reputation=${calculatedReputation}`);
            
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              reputationPoints: calculatedReputation,
              _count: {
                reports: reportsCount
              }
            };
          })
        );
        
        // Sort by calculated reputation
        contributors.sort((a, b) => b.reputationPoints - a.reputationPoints);
      } catch (dbError) {
        console.log('Database error, using mock data for top contributors');
        // Use mock data - calculate reputation points matching profile formula
        const userReportCounts = mockReports.reduce((acc: any, report: any) => {
          acc[report.userId] = (acc[report.userId] || 0) + 1;
          return acc;
        }, {});
        
        // Count votes on each user's reports
        const userVoteCounts = mockUsers.map((user: any) => {
          const userReports = mockReports.filter((r: any) => r.userId === user.id);
          const voteCount = mockVotes.filter((v: any) => 
            userReports.some((r: any) => r.id === v.reportId)
          ).length;
          return { userId: user.id, voteCount };
        });
        
        // Count comments made by each user
        const userCommentCounts = mockUsers.map((user: any) => {
          const commentCount = mockComments.filter((c: any) => c.userId === user.id).length;
          return { userId: user.id, commentCount };
        });
        
        contributors = mockUsers.map((user: any) => {
          const reportCount = userReportCounts[user.id] || 0;
          const voteCount = userVoteCounts.find((u: any) => u.userId === user.id)?.voteCount || 0;
          const commentCount = userCommentCounts.find((u: any) => u.userId === user.id)?.commentCount || 0;
          // Match profile calculation: reports * 10 + votes * 2 + comments
          const calculatedPoints = reportCount * 10 + voteCount * 2 + commentCount;
          console.log(`Analytics MOCK for user ${user.id}: reports=${reportCount}, votes=${voteCount}, comments=${commentCount}, reputation=${calculatedPoints}`);
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            reputationPoints: calculatedPoints,
            _count: {
              reports: reportCount
            }
          };
        }).sort((a: any, b: any) => b.reputationPoints - a.reputationPoints).slice(0, 10);
      }
    }

    console.log('Top contributors returning:', contributors.length, 'users');
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
    const hasDatabase = !!process.env.DATABASE_URL;

    if (!hasDatabase) {
      console.log('No DATABASE_URL, returning empty park statistics');
      // No mock parks available, return empty array
      res.json([]);
      return;
    }

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

      console.log('Park statistics returning:', parkStats.length, 'parks');
      res.json(parkStats);
    } catch (dbError) {
      console.log('Database error fetching park statistics, returning empty array');
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching park statistics:', error);
    res.status(500).json({ error: 'Failed to fetch park statistics' });
  }
});

export default router;
