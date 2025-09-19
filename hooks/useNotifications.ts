// hooks/useNotifications.ts
import { useState, useEffect, useCallback } from "react";

import {
  getFCMToken,
  requestNotificationPermission,
  onForegroundMessage,
  sendTestNotification,
  isPushNotificationSupported,
  NotificationPayload,
} from "@/utils/fcm";

export interface UseNotificationsReturn {
  token: string | null;
  permission: NotificationPermission;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<NotificationPermission>;
  getToken: () => Promise<string | null>;
  sendTestNotification: (payload: NotificationPayload) => Promise<Notification | null>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported] = useState(() => isPushNotificationSupported());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current permission status
  useEffect(() => {
    if (isSupported && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported) return;

    const unsubscribe = onForegroundMessage((payload) => {
      // Handle foreground message - you can customize this behavior
      console.log('Foreground message received:', payload);

      // For example, show a toast notification or update app state
      // You could dispatch to a global state management solution here
    });

    return unsubscribe;
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      const errorMsg = 'Push notifications are not supported in this browser';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const getTokenHandler = useCallback(async (): Promise<string | null> => {
    if (!isSupported) {
      const errorMsg = 'Push notifications are not supported in this browser';
      setError(errorMsg);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fcmToken = await getFCMToken();
      setToken(fcmToken);
      return fcmToken;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get FCM token';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const sendTestNotificationHandler = useCallback(async (payload: NotificationPayload): Promise<Notification | null> => {
    if (!isSupported) {
      const errorMsg = 'Push notifications are not supported in this browser';
      setError(errorMsg);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const notification = await sendTestNotification(payload);
      return notification;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    token,
    permission,
    isSupported,
    isLoading,
    error,
    requestPermission,
    getToken: getTokenHandler,
    sendTestNotification: sendTestNotificationHandler,
  };
};