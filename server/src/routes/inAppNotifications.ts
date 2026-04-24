import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { prisma } from '@/index';
import {
  getMockNotifications,
  getMockUnreadCount,
  markMockNotificationAsRead,
  markAllMockNotificationsAsRead,
  deleteMockNotification,
} from '@/services/inAppNotificationService';
import { mockUsers } from '@/mockDbFile';

const router = Router();

// All notification routes require authentication
router.use(protect);

/**
 * Test endpoint - create a test notification for the current user
 */
router.post('/test', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Add to mock storage using the notifyUser function
    const { notifyUser } = await import('@/services/inAppNotificationService');
    await notifyUser({
      userId,
      type: 'REPORT_COMMENTED',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
    });
    
    res.json({
      success: true,
      message: 'Test notification created',
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test notification',
    });
  }
});

/**
 * Get all notifications for the current user
 */
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { unreadOnly = 'false' } = req.query;

    console.log('GET /api/notifications - userId:', userId, 'unreadOnly:', unreadOnly);

    // Use mock mode directly (no database)
    console.log('Using mock mode for notifications');
    const mockNotifs = getMockNotifications(userId, unreadOnly === 'true');
    
    // Enrich with actor, report, comment data
    const enrichedNotifs = mockNotifs.map((n: any) => {
      const actor = mockUsers.find((u: any) => u.id === n.actorId);
      return {
        ...n,
        actor: actor ? {
          id: actor.id,
          username: actor.username,
          firstName: actor.firstName,
          lastName: actor.lastName,
          profileImageUrl: actor.profileImageUrl,
        } : null,
        report: n.reportId ? { id: n.reportId } : null,
        comment: n.commentId ? { id: n.commentId, content: n.message } : null,
      };
    });

    const unreadCount = getMockUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications: enrichedNotifs,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

/**
 * Mark a notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Use mock mode directly
    console.log('Using mock mode for marking notification as read');
    markMockNotificationAsRead(id);
    res.json({
      success: true,
      data: { count: 1 },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

/**
 * Mark all notifications as read
 */
router.patch('/read-all', async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Use mock mode directly
    console.log('Using mock mode for marking all notifications as read');
    markAllMockNotificationsAsRead(userId);
    res.json({
      success: true,
      data: { count: 1 },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
});

/**
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Use mock mode directly
    console.log('Using mock mode for deleting notification');
    deleteMockNotification(id);
    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    });
  }
});

/**
 * Create a notification (internal use)
 */
export const createNotification = async (data: {
  userId: string;
  type: 'REPORT_VERIFIED' | 'REPORT_COMMENTED' | 'REPORT_RESOLVED' | 'MENTION';
  title: string;
  message: string;
  reportId?: string;
  commentId?: string;
  actorId?: string;
}) => {
  try {
    const notification = await prisma.notification.create({
      data,
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export default router;
