// Push Notification Configuration (Web Push API)
import webpush from 'web-push';

// VAPID Keys - Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGJfScCpXsS1sZUCYr7g06IcJac4t54XFJITo6aVVot2LFIYKNnmfooI7RbB4zOKbFFirsssROLaEGVfJcFIJL8';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '0WNqGNJN7aJCahHLW9eH0gOoTYIgCVJ4Y-fnlnqq_94';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@trailwatch.app';

// Configure web-push
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export { webpush, VAPID_PUBLIC_KEY };
