import { useState, useEffect } from 'react';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getExistingSubscription,
  isNotificationSupported,
  getNotificationPermission
} from '@/services/notificationService';

export default function NotificationSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(isNotificationSupported());
    setPermission(getNotificationPermission());

    // Check existing subscription
    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        const subscription = await getExistingSubscription(registration);
        setIsSubscribed(!!subscription);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permission
      const grantedPermission = await requestNotificationPermission();
      setPermission(grantedPermission);

      if (grantedPermission !== 'granted') {
        setError('Notification permission denied');
        setLoading(false);
        return;
      }

      // Register service worker and subscribe
      const registration = await registerServiceWorker();
      if (!registration) {
        setError('Failed to register service worker');
        setLoading(false);
        return;
      }

      const subscription = await subscribeToNotifications(registration);
      if (subscription) {
        setIsSubscribed(true);
      } else {
        setError('Failed to subscribe to notifications');
      }
    } catch (err) {
      setError('Failed to enable notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const registration = await registerServiceWorker();
      if (!registration) {
        setError('Failed to register service worker');
        setLoading(false);
        return;
      }

      const subscription = await getExistingSubscription(registration);
      if (subscription) {
        const success = await unsubscribeFromNotifications(subscription);
        if (success) {
          setIsSubscribed(false);
        } else {
          setError('Failed to unsubscribe from notifications');
        }
      }
    } catch (err) {
      setError('Failed to disable notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">
        Push Notifications
      </h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {permission === 'default' && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Enable push notifications to receive alerts about trail conditions and safety updates.
            </p>
          </div>
          <button
            onClick={handleEnableNotifications}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-medium">Notifications Blocked</p>
          <p className="text-sm mt-1">
            Please enable notifications in your browser settings to receive trail safety alerts.
          </p>
        </div>
      )}

      {permission === 'granted' && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              {isSubscribed ? 'You are subscribed to push notifications' : 'Notifications are enabled'}
            </p>
          </div>
          {isSubscribed ? (
            <button
              onClick={handleDisableNotifications}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Disabling...' : 'Disable Notifications'}
            </button>
          ) : (
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enabling...' : 'Subscribe'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
