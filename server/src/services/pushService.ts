// Push Notification Service
import { webpush } from '@/config/push';
import { mockSubscriptions, addPushSubscription, removePushSubscription, getUserSubscriptions } from '@/mockDb';
import { prisma } from '@/index';

export interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Check if database is available
const isDatabaseAvailable = (): boolean => {
  return !!process.env.DATABASE_URL;
};

// Save push subscription for a user
export const saveSubscription = async (userId: string, subscription: PushSubscription): Promise<boolean> => {
  try {
    // Try database first if available
    if (isDatabaseAvailable()) {
      try {
        await prisma.pushSubscription.create({
          data: {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
          },
        });
        return true;
      } catch (dbError) {
        console.log('Database error, falling back to mock for push subscription');
      }
    }
    
    // Fallback to mock
    addPushSubscription({
      id: `sub_${Date.now()}`,
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expirationTime: subscription.expirationTime || null,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
};

// Remove push subscription
export const deleteSubscription = async (endpoint: string): Promise<boolean> => {
  try {
    // Try database first if available
    if (isDatabaseAvailable()) {
      try {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint },
        });
        return true;
      } catch (dbError) {
        console.log('Database error, falling back to mock for push unsubscription');
      }
    }
    
    // Fallback to mock
    removePushSubscription(endpoint);
    return true;
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return false;
  }
};

// Send push notification to a specific subscription
export const sendPushNotification = async (
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> => {
  try {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    // If subscription is expired/invalid, remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      await deleteSubscription(subscription.endpoint);
      console.log('Removed expired push subscription');
    } else {
      console.error('Error sending push notification:', error);
    }
    return false;
  }
};

// Send notification to a specific user
export const sendNotificationToUser = async (
  userId: string,
  payload: NotificationPayload
): Promise<number> => {
  let sentCount = 0;
  
  try {
    // Get user subscriptions
    let subscriptions: PushSubscription[] = [];
    
    // Try database first if available
    if (isDatabaseAvailable()) {
      try {
        const dbSubs = await prisma.pushSubscription.findMany({
          where: { userId },
        });
        subscriptions = dbSubs.map((sub: any) => ({
          endpoint: sub.endpoint,
          expirationTime: sub.expirationTime?.getTime(),
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }));
      } catch (dbError) {
        console.log('Database error, falling back to mock for subscriptions');
      }
    }
    
    // If no subscriptions from DB, use mock
    if (subscriptions.length === 0) {
      const mockSubs = getUserSubscriptions(userId);
      subscriptions = mockSubs.map((sub: any) => ({
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }));
    }
    
    // Send to all user devices
    for (const subscription of subscriptions) {
      const sent = await sendPushNotification(subscription, payload);
      if (sent) sentCount++;
    }
    
    return sentCount;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return sentCount;
  }
};

// Send notification to all users near a location
export const sendNotificationToNearbyUsers = async (
  lat: number,
  lng: number,
  radiusKm: number,
  excludeUserId: string,
  payload: NotificationPayload
): Promise<number> => {
  let sentCount = 0;
  
  try {
    // Get all active reports to find users who have reported nearby
    let nearbyUserIds: string[] = [];
    
    // Try database first if available
    if (isDatabaseAvailable()) {
      try {
        const nearbyReports = await prisma.report.findMany({
          where: {
            isActive: true,
            userId: { not: excludeUserId },
          },
          include: { user: true },
        });
        
        // Filter reports within radius
        for (const report of nearbyReports) {
          if (report.location && (report.location as any).coordinates) {
            const coords = (report.location as any).coordinates;
            const distance = calculateDistance(lat, lng, coords[1], coords[0]);
            if (distance <= radiusKm && !nearbyUserIds.includes(report.userId)) {
              nearbyUserIds.push(report.userId);
            }
          }
        }
      } catch (dbError) {
        console.log('Database error, falling back to mock for nearby reports');
      }
    }
    
    // If no results from DB, use mock
    if (nearbyUserIds.length === 0) {
      const { mockReports } = await import('@/mockDb');
      for (const report of mockReports) {
        if (report.isActive && report.userId !== excludeUserId && report.location?.coordinates) {
          const distance = calculateDistance(
            lat, lng,
            report.location.coordinates[1],
            report.location.coordinates[0]
          );
          if (distance <= radiusKm && !nearbyUserIds.includes(report.userId)) {
            nearbyUserIds.push(report.userId);
          }
        }
      }
    }
    
    // Send notifications to nearby users
    for (const userId of nearbyUserIds) {
      const sent = await sendNotificationToUser(userId, payload);
      sentCount += sent;
    }
    
    return sentCount;
  } catch (error) {
    console.error('Error sending nearby notifications:', error);
    return sentCount;
  }
};

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Common notification templates
export const NotificationTemplates = {
  newHazardNearby: (hazardType: string, distance: string): NotificationPayload => ({
    title: '⚠️ New Hazard Nearby',
    body: `${hazardType} reported ${distance} from your location`,
    icon: '/icons/hazard-icon.png',
    badge: '/icons/badge-icon.png',
    tag: 'new-hazard',
    data: { type: 'new-hazard' },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),
  
  reportValidated: (count: number): NotificationPayload => ({
    title: '✅ Report Validated',
    body: `${count} person${count > 1 ? 's' : ''} confirmed your hazard report`,
    icon: '/icons/validated-icon.png',
    badge: '/icons/badge-icon.png',
    tag: 'report-validated',
    data: { type: 'report-validated' },
  }),
  
  reportExpiring: (hoursLeft: number): NotificationPayload => ({
    title: '⏰ Report Expiring Soon',
    body: `Your report expires in ${hoursLeft} hours. Update or renew it.`,
    icon: '/icons/clock-icon.png',
    badge: '/icons/badge-icon.png',
    tag: 'report-expiring',
    data: { type: 'report-expiring' },
  }),
  
  newComment: (username: string): NotificationPayload => ({
    title: '💬 New Comment',
    body: `${username} commented on your report`,
    icon: '/icons/comment-icon.png',
    badge: '/icons/badge-icon.png',
    tag: 'new-comment',
    data: { type: 'new-comment' },
  }),
};
