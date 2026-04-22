// Service Worker for Push Notifications
const CACHE_NAME = 'trailwatch-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  const data = event.data?.json() || {};
  const title = data.title || 'TrailWatch';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-icon.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Handle different notification types
  if (data.type === 'new-hazard') {
    url = '/app/reports';
  } else if (data.type === 'report-validated') {
    url = '/app/profile';
  } else if (data.type === 'new-comment') {
    url = `/app/reports/${data.reportId}`;
  }

  // Handle action buttons
  if (event.action === 'view' && data.reportId) {
    url = `/app/reports/${data.reportId}`;
  } else if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window if not open
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Fetch event (basic caching strategy)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();
        
        // Open cache and store response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // Return cached version if available
        return caches.match(event.request);
      })
  );
});
