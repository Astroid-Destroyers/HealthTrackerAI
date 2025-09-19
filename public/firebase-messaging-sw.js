// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

let messaging = null;
let isInitialized = false;

// Initialize Firebase when config is received
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    if (!isInitialized) {
      try {
        firebase.initializeApp(event.data.config);
        messaging = firebase.messaging();
        isInitialized = true;

        console.log('Firebase initialized in service worker');

        // Set up background message handler
        messaging.onBackgroundMessage((payload) => {
          console.log('Received background message:', payload);

          const notificationTitle = payload.notification?.title || payload.data?.title || 'HealthTrackerAI';
          const notificationOptions = {
            body: payload.notification?.body || payload.data?.body || 'You have a new notification',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: payload.data || {},
            tag: payload.data?.tag || payload.notification?.tag || 'health-tracker-notification',
            requireInteraction: payload.data?.requireInteraction === 'true' || false,
            silent: payload.data?.silent === 'true' || false,
          };

          // Add mobile-specific options if on mobile
          if (self.navigator && /Android|iPhone|iPad|iPod/i.test(self.navigator.userAgent)) {
            notificationOptions.vibrate = [200, 100, 200];
            notificationOptions.actions = [
              {
                action: 'view',
                title: 'View'
              },
              {
                action: 'dismiss',
                title: 'Dismiss'
              }
            ];
          }

          return self.registration.showNotification(notificationTitle, notificationOptions);
        });

      } catch (error) {
        console.error('Failed to initialize Firebase in service worker:', error);
      }
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};
  const appUrl = notificationData.url || '/';

  // Handle different notification actions
  if (action === 'dismiss') {
    // Just close the notification, no navigation
    return;
  }

  // Default action or 'view' action
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url.includes(appUrl) && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(appUrl);
      }
    })
  );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(clients.claim());
});