import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  isPushSupported,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  initializePushNotifications,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
} from '@/services/pushService';

export function PushNotificationSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const pushSupported = isPushSupported();
    const notificationSupported = isNotificationSupported();
    setIsSupported(pushSupported && notificationSupported);

    if (notificationSupported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted' && pushSupported) {
        const registration = await registerServiceWorker();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      }
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      // Request permission
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        console.log('Permission granted, initializing push...');
        // Initialize push
        const success = await initializePushNotifications();
        console.log('Initialize result:', success);
        if (success) {
          setIsSubscribed(true);
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive push notifications',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to enable push notifications. Check console for details.',
            variant: 'destructive',
          });
        }
      } else if (newPermission === 'denied') {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error enabling notifications:', error?.message || error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to enable notifications',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        const success = await unsubscribeFromPush(registration);
        if (success) {
          setIsSubscribed(false);
          toast({
            title: 'Notifications Disabled',
            description: 'You will no longer receive push notifications',
          });
        } else {
          // Even if server fails, update local state
          setIsSubscribed(false);
          toast({
            title: 'Notifications Disabled',
            description: 'Push notifications disabled locally',
          });
        }
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      // Still update state to allow user to try again
      setIsSubscribed(false);
      toast({
        title: 'Notifications Disabled',
        description: 'Push notifications disabled',
      });
    }
    setLoading(false);
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      console.log('Sending test notification...');
      
      // Check if subscribed first
      if (!isSubscribed) {
        toast({
          title: 'Not Subscribed',
          description: 'Please enable push notifications first',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const success = await sendTestNotification();
      console.log('Test notification result:', success);
      
      if (success) {
        toast({
          title: 'Test Sent',
          description: 'Check your device for the test notification',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: 'Could not send test notification. Your subscription may be invalid.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error sending test:', error?.message || error);
      
      // Check if it's a network error
      if (error?.message?.includes('fetch') || error?.name === 'TypeError') {
        toast({
          title: 'Server Unavailable',
          description: 'Backend server may be down. Please try again later.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: error?.message || 'Failed to send test notification',
          variant: 'destructive',
        });
      }
    }
    setLoading(false);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <BellRing className="h-5 w-5 text-green-500" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about new hazards near you, report validations, and comments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {permission === 'granted'
                ? 'Notifications are enabled'
                : permission === 'denied'
                ? 'Permission denied by browser'
                : 'Permission not granted yet'}
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={isSubscribed ? handleDisable : handleEnable}
            disabled={loading || permission === 'denied'}
          />
        </div>

        {isSubscribed && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={loading}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <p className="text-xs text-red-500">
            Notifications are blocked. Please enable them in your browser settings and refresh the page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
