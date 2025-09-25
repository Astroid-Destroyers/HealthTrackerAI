// utils/swRegistration.ts
import { getMessagingInstance } from "@/lib/firebase";

export const registerServiceWorker = async () => {
  if (typeof window === 'undefined') return;

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    // Send Firebase config to the service worker
    const messaging = await getMessagingInstance();
    if (messaging && registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: {
          apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
          storageBucket: "healthtrackerai-e5819.firebasestorage.app",
          messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FB_APP_ID,
        }
      });
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
};

export const unregisterServiceWorker = async () => {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service Worker unregistered');
      }
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }
};