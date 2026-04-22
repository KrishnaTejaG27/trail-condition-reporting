import webpush from 'web-push';

// VAPID keys - these should be in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@trailsafety.com';

// Initialize web-push with VAPID keys only if keys are configured
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_EMAIL,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function sendPushNotificationToMultiple(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<void> {
  const promises = subscriptions.map(subscription =>
    sendPushNotification(subscription, payload)
  );
  await Promise.allSettled(promises);
}

/**
 * Generate VAPID keys (for initial setup)
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}

/**
 * Get VAPID public key (for frontend)
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
