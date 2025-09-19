// Example usage of the FCM hook
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationTest() {
  const {
    permission,
    isSupported,
    isLoading,
    error,
    requestPermission,
    getToken,
    sendTestNotification
  } = useNotifications();

  const handleEnableNotifications = async () => {
    try {
      const perm = await requestPermission();
      if (perm === 'granted') {
        const token = await getToken();
        console.log('FCM Token:', token);
        // Send this token to your backend to send push notifications
      }
    } catch (err) {
      console.error('Failed to enable notifications:', err);
    }
  };

  const handleTestNotification = () => {
    sendTestNotification({
      title: 'Test Notification',
      body: 'This is a test push notification!',
      icon: '/favicon.ico',
      tag: 'test-notification'
    });
  };

  if (!isSupported) {
    return <div>Push notifications are not supported in this browser.</div>;
  }

  return (
    <div>
      <h2>Push Notifications</h2>
      <p>Permission: {permission}</p>

      {permission === 'default' && (
        <button onClick={handleEnableNotifications} disabled={isLoading}>
          {isLoading ? 'Requesting...' : 'Enable Notifications'}
        </button>
      )}

      {permission === 'granted' && (
        <div>
          <button onClick={handleTestNotification}>
            Send Test Notification
          </button>
          <button onClick={getToken}>
            Get FCM Token
          </button>
        </div>
      )}

      {error && <p style={{color: 'red'}}>Error: {error}</p>}
    </div>
  );
}