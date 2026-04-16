import { Router } from 'express';
import { protect } from '@/middleware/auth';
import {
  sendPushNotification,
  sendPushNotificationToMultiple,
  getVapidPublicKey
} from '@/services/notificationService';
import { prisma } from '@/index';

const router = Router();

// All notification routes require authentication
router.use(protect);

/**
 * Get VAPID public key for frontend subscription
 */
router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      return res.status(500).json({ error: 'VAPID keys not configured' });
    }
    res.json({ publicKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get VAPID public key' });
  }
});

/**
 * Subscribe to push notifications
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = (req as any).user.id;

    // Validate subscription data
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Store subscription in database
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

/**
 * Unsubscribe from push notifications
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = (req as any).user.id;

    // Remove subscription from database
    await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint
      }
    });

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * Send test notification (for development)
 */
router.post('/test', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys) {
      return res.status(400).json({ error: 'Subscription data required' });
    }

    await sendPushNotification(
      { endpoint, keys },
      {
        title: 'Test Notification',
        body: 'This is a test notification from Trail Safety Platform',
        icon: '/icon-192x192.png'
      }
    );

    res.json({ message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
