// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase config will be set by the main app
let firebaseConfig = null;
let messaging = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    if (firebaseConfig && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
    }
  }
});

// Handle background messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    if (firebaseConfig && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();

      // Set up background message handler after config is received
      messaging.onBackgroundMessage((payload) => {
        console.log('Received background message:', payload);

        const notificationTitle = payload.notification?.title || 'HealthTrackerAI';
        const notificationOptions = {
          body: payload.notification?.body || 'You have a new notification',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: payload.data,
          tag: payload.data?.tag || 'health-tracker-notification',
          requireInteraction: false,
          silent: false,
          // Mobile-specific options
          vibrate: [200, 100, 200], // Vibration pattern for mobile devices
          actions: [
            {
              action: 'view',
              title: 'View',
              icon: '/favicon.ico'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const action = event.action;
  const appUrl = '/';

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