import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { prisma } from '@/index';
import { mockReports, mockComments, mockVotes } from '@/mockDb';

const router = Router();

/**
 * Get current user's statistics
 */
router.get('/me/stats', protect, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    
    // Try database first
    try {
      const [
        reportsCount,
        totalVotesOnReports,
        commentsMade,
        resolvedReports
      ] = await Promise.all([
        prisma.report.count({ where: { userId } }),
        prisma.vote.count({ 
          where: { 
            report: { userId } 
          } 
        }),
        prisma.comment.count({ where: { userId } }),
        prisma.report.count({ 
          where: { 
            userId,
            isResolved: true 
          } 
        })
      ]);

      const calculatedReputation = reportsCount * 10 + totalVotesOnReports * 2 + commentsMade;
      console.log(`Profile stats for user ${userId}: reports=${reportsCount}, votes=${totalVotesOnReports}, comments=${commentsMade}, reputation=${calculatedReputation}`);
      
      return res.json({
        success: true,
        data: {
          reports: reportsCount,
          verifications: totalVotesOnReports,
          comments: commentsMade,
          resolved: resolvedReports,
          reputation: calculatedReputation
        }
      });
    } catch (dbError) {
      // Mock fallback
      console.log('Using mock data for user stats');
      
      const userReports = mockReports.filter(r => r.userId === userId);
      const reportsCount = userReports.length;
      
      // Count votes on user's reports
      const totalVotesOnReports = mockVotes.filter(v => 
        userReports.some(r => r.id === v.reportId)
      ).length;
      
      // Count comments made by user (on any report)
      const commentsMade = mockComments.filter(c => c.userId === userId).length;
      
      const resolvedReports = userReports.filter(r => r.isResolved).length;
      const mockCalculatedReputation = reportsCount * 10 + totalVotesOnReports * 2 + commentsMade;
      console.log(`Profile MOCK for user ${userId}: reports=${reportsCount}, votes=${totalVotesOnReports}, comments=${commentsMade}, reputation=${mockCalculatedReputation}`);

      return res.json({
        success: true,
        data: {
          reports: reportsCount,
          verifications: totalVotesOnReports,
          comments: commentsMade,
          resolved: resolvedReports,
          reputation: mockCalculatedReputation
        },
        message: 'Stats fetched (mock)'
      });
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats'
    });
  }
});

export default router;
