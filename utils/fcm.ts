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
 * Check if push notifications are supported in the current browser
 */
export const isPushNotificationSupported = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check for basic Notification API
  if (!("Notification" in window)) return false;

  // Check for service worker support
  if (!("serviceWorker" in navigator)) return false;

  // Check for Push API
  if (!("PushManager" in window)) return false;

  return true;
};

/**
 * Get browser-specific information for debugging
 */
export const getBrowserInfo = () => {
  if (typeof window === "undefined") return null;

  const ua = navigator.userAgent;
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua);

  return {
    userAgent: ua,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isMobile,
    isIOS,
    supportsNotifications: "Notification" in window,
    supportsServiceWorker: "serviceWorker" in navigator,
    supportsPush: "PushManager" in window,
    notificationPermission: "Notification" in window ? Notification.permission : "unsupported"
  };
};

/**
 * Request permission for push notifications with enhanced error handling
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  const browserInfo = getBrowserInfo();

  if (!browserInfo?.supportsNotifications) {
    throw new Error(`This browser does not support notifications. Browser info: ${JSON.stringify(browserInfo)}`);
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    throw new Error("Notification permission was denied. Please enable notifications in your browser settings.");
  }

  try {
    const permission = await Notification.requestPermission();

    // Handle iOS Safari specific behavior
    if (browserInfo.isIOS && browserInfo.isSafari && permission === 'default') {
      console.warn('iOS Safari returned "default" permission. This may indicate limited push notification support.');
    }

    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    throw new Error(`Failed to request notification permission: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Get FCM registration token with enhanced browser support
 */
export const getFCMToken = async (): Promise<string | null> => {
  const browserInfo = getBrowserInfo();

  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn("Firebase messaging is not supported in this browser", browserInfo);
      return null;
    }

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted", { permission, browserInfo });
      return null;
    }

    // Get the VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_FB_VAPID_KEY;
    if (!vapidKey) {
      console.error("VAPID key not found in environment variables");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
    });

    if (!token) {
      console.warn("Failed to get FCM token - VAPID key may be invalid or browser may not support FCM", browserInfo);
      return null;
    }

    console.log("FCM token obtained successfully", {
      browserInfo: browserInfo ? {
        isChrome: browserInfo.isChrome,
        isFirefox: browserInfo.isFirefox,
        isSafari: browserInfo.isSafari,
        isMobile: browserInfo.isMobile
      } : null
    });
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error, browserInfo);
    return null;
  }
};

/**
 * Listen for foreground messages with enhanced error handling
 */
export const onForegroundMessage = (callback: (payload: any) => void) => {
  getMessagingInstance().then((messaging) => {
    if (messaging) {
      try {
        onMessage(messaging, (payload) => {
          console.log("Received foreground message:", payload);
          callback(payload);
        });
      } catch (error) {
        console.error("Error setting up foreground message listener:", error);
      }
    } else {
      console.warn("Foreground message listener not set up - messaging not supported");
    }
  }).catch((error) => {
    console.error("Error initializing foreground message listener:", error);
  });
};

/**
 * Send a test notification with enhanced browser-specific handling
 */
export const sendTestNotification = async (payload: NotificationPayload) => {
  const browserInfo = getBrowserInfo();

  if (Notification.permission !== "granted") {
    throw new Error("Notification permission not granted");
  }

  // Detect device capabilities
  const isMobile = browserInfo?.isMobile || false;
  const isIOS = browserInfo?.isIOS || false;
  const isSafari = browserInfo?.isSafari || false;

  const notification = new Notification(payload.title, {
    body: payload.body,
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
    tag: payload.tag || "test-notification",
    requireInteraction: payload.requireInteraction || false,
    silent: payload.silent || false,
    data: payload.data,
    // Mobile-specific enhancements
    ...(isMobile && {
      vibrate: isIOS ? [100, 50, 100] : [200, 100, 200], // iOS prefers shorter vibrations
      actions: isSafari ? undefined : [ // Safari does not support actions well
        {
          action: "view",
          title: "View"
        }
      ]
    })
  });

  return notification;
};

/**
 * Check if the current environment supports advanced push notification features
 */
export const getNotificationCapabilities = () => {
  const browserInfo = getBrowserInfo();

  return {
    ...browserInfo,
    supportsBackgroundMessages: browserInfo?.supportsServiceWorker || false,
    supportsActions: browserInfo ? !browserInfo.isSafari : true, // Safari has limited action support
    supportsVibration: browserInfo?.isMobile || false,
    recommendedApproach: browserInfo?.isSafari ? "basic" : "advanced"
  };
};
