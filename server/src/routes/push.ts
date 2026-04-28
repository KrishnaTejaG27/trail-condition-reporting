// Push Notification Routes
import { Router } from 'express';
import { AuthRequest, protect } from '@/middleware/auth';
import { VAPID_PUBLIC_KEY } from '@/config/push';
import { 
  saveSubscription, 
  deleteSubscription,
  sendNotificationToUser,
  sendNotificationToNearbyUsers,
  NotificationTemplates 
} from '@/services/pushService';

const router = Router();

// Get VAPID public key (for client subscription)
router.get('/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    data: { publicKey: VAPID_PUBLIC_KEY },
  });
});

// Subscribe to push notifications
router.post('/subscribe', protect, async (req: AuthRequest, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription data',
      });
    }

    const saved = await saveSubscription(req.user!.id, subscription);
    
    if (saved) {
      res.json({
        success: true,
        message: 'Push notification subscription saved',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save subscription',
      });
    }
  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to push notifications',
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', protect, async (req: AuthRequest, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint is required',
      });
    }

    const removed = await deleteSubscription(endpoint);
    
    if (removed) {
      res.json({
        success: true,
        message: 'Push notification subscription removed',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to remove subscription',
      });
    }
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from push notifications',
    });
  }
});

// Send test notification to current user
router.post('/test', protect, async (req: AuthRequest, res) => {
  try {
    console.log('Test notification request for user:', req.user!.id);
    const payload = NotificationTemplates.reportValidated(3);
    console.log('Payload:', payload);
    
    const sent = await sendNotificationToUser(req.user!.id, payload);
    console.log('Notifications sent:', sent);
    
    if (sent > 0) {
      res.json({
        success: true,
        data: { sent },
        message: `Test notification sent to ${sent} device(s)`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No active subscription found. Please re-enable push notifications.',
      });
    }
  } catch (error: any) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to send test notification',
    });
  }
});

export default router;
