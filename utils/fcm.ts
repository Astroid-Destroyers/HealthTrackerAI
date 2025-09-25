// utils/fcm.ts
import { getToken, onMessage } from "firebase/messaging";

import { getMessagingInstance } from "@/lib/firebase";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Request permission for push notifications
 */
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications");
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    const permission = await Notification.requestPermission();

    return permission;
  };

/**
 * Get FCM registration token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = await getMessagingInstance();

    if (!messaging) {
      console.warn("Firebase messaging is not supported in this browser");

      return null;
    }

    const permission = await requestNotificationPermission();

    if (permission !== "granted") {
      console.warn("Notification permission not granted");

      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FB_VAPID_KEY,
    });

    if (!token) {
      console.warn("Failed to get FCM token - VAPID key may be invalid");

      return null;
    }

    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);

    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (callback: (payload: any) => void) => {
  getMessagingInstance().then((messaging) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("Received foreground message:", payload);
        callback(payload);
      });
    }
  });
};

/**
 * Send a test notification (for development)
 */
export const sendTestNotification = async (payload: NotificationPayload) => {
  if (Notification.permission === "granted") {
    // Detect if we're on a mobile device and Chrome
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isChrome =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/favicon.ico",
      badge: payload.badge || "/favicon.ico",
      tag: payload.tag || "test-notification",
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      data: payload.data,
      // Chrome mobile-specific enhancements
      ...(isMobile &&
        isChrome && {
          vibrate: [200, 100, 200, 100, 200], // Enhanced vibration pattern for Chrome
          actions: [
            { action: "view", title: "Open App" },
            { action: "dismiss", title: "Dismiss" },
          ],
          // Chrome-specific options
          renotify: false,
          noscreen: false,
        }),
      // Standard mobile enhancements for other browsers
      ...(isMobile &&
        !isChrome && {
          vibrate: [200, 100, 200],
          actions: [
            { action: "view", title: "View" },
            { action: "dismiss", title: "Dismiss" },
          ],
        }),
    });

    // Chrome-specific: Add click handler for better UX
    if (isChrome) {
      notification.onclick = () => {
        notification.close();
        window.focus();
        // Navigate to app
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      };
    }

    // Auto-close after 5 seconds if not requiring interaction
    if (!payload.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  } else {
    console.warn("Notification permission not granted");

    return null;
  }
};

/**
 * Check if push notifications are supported
 */
export const isPushNotificationSupported = (): boolean => {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

/**
 * Register the service worker
 */
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers are not supported in this browser");

      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
        },
      );

      console.log("Service worker registered successfully:", registration);

      // Send Firebase config to service worker
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
        storageBucket: "healthtrackerai-e5819.firebasestorage.app",
        messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FB_APP_ID,
      };

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Send config to service worker
      registration.active?.postMessage({
        type: "FIREBASE_CONFIG",
        config: firebaseConfig,
      });

      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available, notify user
              console.log(
                "New service worker available, consider refreshing the page",
              );
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error("Service worker registration failed:", error);

      return null;
    }
  };
