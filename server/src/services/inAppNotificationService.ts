import { createNotification } from '@/routes/inAppNotifications';
import { mockUsers } from '@/mockDbFile';
import { emitNotification } from '@/services/socketService';

// Mock notification storage
const mockNotifications: any[] = [];

/**
 * Create a notification for a user
 */
export const notifyUser = async (data: {
  userId: string;
  type: 'REPORT_VERIFIED' | 'REPORT_COMMENTED' | 'REPORT_RESOLVED' | 'MENTION';
  title: string;
  message: string;
  reportId?: string;
  commentId?: string;
  actorId?: string;
}) => {
  try {
    // Try database first
    await createNotification(data);
  } catch (error) {
    console.log('Database notification failed, using mock mode:', error);
    // Mock mode - store in memory
    const notification = {
      id: `notif_${Date.now()}`,
      ...data,
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    mockNotifications.push(notification);
    console.log('Mock notification created:', notification);
    
    // Emit real-time notification via socket
    emitNotification(data.userId, notification);
  }
};

/**
 * Get mock notifications for a user
 */
export const getMockNotifications = (userId: string, unreadOnly = false) => {
  let filtered = mockNotifications.filter((n) => n.userId === userId);
  if (unreadOnly) {
    filtered = filtered.filter((n) => !n.isRead);
  }
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get mock unread count
 */
export const getMockUnreadCount = (userId: string) => {
  return mockNotifications.filter((n) => n.userId === userId && !n.isRead).length;
};

/**
 * Mark mock notification as read
 */
export const markMockNotificationAsRead = (id: string) => {
  const notification = mockNotifications.find((n) => n.id === id);
  if (notification) {
    notification.isRead = true;
    notification.readAt = new Date().toISOString();
  }
};

/**
 * Mark all mock notifications as read for a user
 */
export const markAllMockNotificationsAsRead = (userId: string) => {
  mockNotifications.forEach((n) => {
    if (n.userId === userId) {
      n.isRead = true;
      n.readAt = new Date().toISOString();
    }
  });
};

/**
 * Delete mock notification
 */
export const deleteMockNotification = (id: string) => {
  const index = mockNotifications.findIndex((n) => n.id === id);
  if (index > -1) {
    mockNotifications.splice(index, 1);
  }
};

/**
 * Notify report owner when someone comments on their report
 */
export const notifyReportCommented = async (
  reportId: string,
  commentId: string,
  commentAuthorId: string,
  reportOwnerId: string
) => {
  if (commentAuthorId === reportOwnerId) {
    return; // Don't notify if user commented on their own report
  }

  const commentAuthor = mockUsers.find((u: any) => u.id === commentAuthorId);
  const authorName = commentAuthor?.username || 'Someone';

  await notifyUser({
    userId: reportOwnerId,
    type: 'REPORT_COMMENTED',
    title: 'New Comment on Your Report',
    message: `${authorName} commented on your report`,
    reportId,
    commentId,
    actorId: commentAuthorId,
  });
};

/**
 * Notify report owner when their report is verified
 */
export const notifyReportVerified = async (
  reportId: string,
  reportOwnerId: string,
  verifierId: string
) => {
  if (verifierId === reportOwnerId) {
    return; // Don't notify if user verified their own report
  }

  const verifier = mockUsers.find((u: any) => u.id === verifierId);
  const verifierName = verifier?.username || 'Someone';

  await notifyUser({
    userId: reportOwnerId,
    type: 'REPORT_VERIFIED',
    title: 'Report Verified',
    message: `${verifierName} verified your report`,
    reportId,
    actorId: verifierId,
  });
};

/**
 * Notify report owner when their report is resolved
 */
export const notifyReportResolved = async (
  reportId: string,
  reportOwnerId: string,
  resolverId: string
) => {
  if (resolverId === reportOwnerId) {
    return; // Don't notify if user resolved their own report
  }

  const resolver = mockUsers.find((u: any) => u.id === resolverId);
  const resolverName = resolver?.username || 'Someone';

  await notifyUser({
    userId: reportOwnerId,
    type: 'REPORT_RESOLVED',
    title: 'Report Resolved',
    message: `${resolverName} resolved your report`,
    reportId,
    actorId: resolverId,
  });
};

/**
 * Notify user when mentioned in a comment
 */
export const notifyMentioned = async (
  mentionedUserId: string,
  commentId: string,
  commentAuthorId: string,
  reportId: string
) => {
  if (commentAuthorId === mentionedUserId) {
    return; // Don't notify if user mentioned themselves
  }

  const commentAuthor = mockUsers.find((u: any) => u.id === commentAuthorId);
  const authorName = commentAuthor?.username || 'Someone';

  await notifyUser({
    userId: mentionedUserId,
    type: 'MENTION',
    title: 'You Were Mentioned',
    message: `${authorName} mentioned you in a comment`,
    reportId,
    commentId,
    actorId: commentAuthorId,
  });
};
