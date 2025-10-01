// utils/mobile-notification-fix.ts
export const enhancedMobileNotificationSupport = async (): Promise<{
  isSupported: boolean;
  reasons: string[];
  suggestions: string[];
}> => {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  
  // Basic checks
  if (typeof window === "undefined") {
    reasons.push("Not in browser environment");
    return { isSupported: false, reasons, suggestions };
  }

  const hasServiceWorker = "serviceWorker" in navigator;
  const hasPushManager = "PushManager" in window;
  const hasNotification = "Notification" in window;
  const isHTTPS = location.protocol === "https:" || location.hostname === "localhost";
  
  // Device detection
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  
  // Check basic requirements
  if (!hasServiceWorker) {
    reasons.push("Service Worker not supported");
    suggestions.push("Try updating your browser");
  }
  
  if (!hasPushManager) {
    reasons.push("Push Manager not supported");
    suggestions.push("This browser doesn't support push notifications");
  }
  
  if (!hasNotification) {
    reasons.push("Notifications API not supported");
    suggestions.push("This browser doesn't support the Notifications API");
  }
  
  // HTTPS requirement
  if (!isHTTPS) {
    reasons.push("HTTPS required");
    suggestions.push("Push notifications require HTTPS or localhost");
  }
  
  // Mobile-specific checks
  if (isMobile) {
    if (isAndroid && isChrome) {
      // Android Chrome should work if all APIs are available
      if (!isHTTPS) {
        reasons.push("Android Chrome requires HTTPS");
        suggestions.push("Use HTTPS for push notifications on Android Chrome");
      }
    } else if (isIOS) {
      // iOS has specific requirements
      if (!isStandalone && !isSafari) {
        reasons.push("iOS requires Safari or PWA mode");
        suggestions.push("On iOS, use Safari or add the app to home screen");
      }
      
      // Check iOS version (iOS 16.4+ has better support)
      const iosVersion = userAgent.match(/OS (\d+)_(\d+)/);
      if (iosVersion) {
        const majorVersion = parseInt(iosVersion[1]);
        if (majorVersion < 16) {
          reasons.push("iOS version may not support push notifications");
          suggestions.push("Update to iOS 16.4+ for better push notification support");
        }
      }
    }
  }
  
  // Try to register service worker
  if (hasServiceWorker) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      if (!registration) {
        reasons.push("Service worker registration failed");
        suggestions.push("Check if firebase-messaging-sw.js exists");
      }
    } catch (error) {
      reasons.push(`Service worker registration error: ${error}`);
      suggestions.push("Check browser console for service worker errors");
    }
  }
  
  // Check permission state
  if (hasNotification) {
    if (Notification.permission === "denied") {
      reasons.push("Notification permission denied");
      suggestions.push("Enable notifications in browser settings");
    }
  }
  
  const isSupported = hasServiceWorker && hasPushManager && hasNotification && isHTTPS && 
    (!isMobile || (isAndroid && isChrome) || (isIOS && (isStandalone || isSafari)));
  
  return { isSupported, reasons, suggestions };
};