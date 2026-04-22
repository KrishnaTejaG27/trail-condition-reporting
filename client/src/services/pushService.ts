// Frontend Push Notification Service
import { api } from '@/lib/api';

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Get push subscription
export const getPushSubscription = async (
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> => {
  try {
    // Get VAPID public key from server
    console.log('Fetching VAPID public key...');
    const vapidResponse = await api.push.getVapidPublicKey();
    console.log('VAPID response status:', vapidResponse.status);
    
    if (!vapidResponse.ok) {
      throw new Error(`Failed to get VAPID key: ${vapidResponse.status}`);
    }
    
    const result = await vapidResponse.json();
    console.log('VAPID result:', result);
    
    if (!result.data?.publicKey) {
      throw new Error('Invalid VAPID response: missing publicKey');
    }
    
    const { publicKey } = result.data;

    // Convert VAPID key to Uint8Array
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

    // Subscribe
    console.log('Subscribing to push...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as any,
    });
    console.log('Browser subscription created:', subscription.endpoint);

    // Send subscription to server
    console.log('Sending subscription to server...');
    const response = await api.push.subscribe(subscription.toJSON());
    console.log('Server response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save subscription on server: ${response.status} - ${errorText}`);
    }

    console.log('Push notification subscription created successfully');
    return subscription;
  } catch (error: any) {
    console.error('Error subscribing to push:', error?.message || error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (
  registration: ServiceWorkerRegistration
): Promise<boolean> => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Unsubscribe from browser
      await subscription.unsubscribe();
      
      // Remove from server
      const response = await api.push.unsubscribe(subscription.endpoint);
      if (!response.ok) {
        console.warn('Failed to remove subscription from server');
      }
      
      console.log('Push notification subscription removed');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Check if push is supported
export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Get current notification permission
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

// Initialize push notifications (call this on app startup)
export const initializePushNotifications = async (): Promise<boolean> => {
  // Check support
  if (!isPushSupported()) {
    console.log('Push notifications not supported');
    return false;
  }

  // Register service worker
  const registration = await registerServiceWorker();
  if (!registration) return false;

  // Check permission
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  // Get or create subscription
  let subscription = await getPushSubscription(registration);
  if (!subscription) {
    subscription = await subscribeToPush(registration);
  }

  return !!subscription;
};

// Helper: Convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Test notification (for development)
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    const response = await api.push.test();
    return response.ok;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};
