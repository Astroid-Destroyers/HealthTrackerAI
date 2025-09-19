import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Firebase imports for profile updates
import { updateProfile } from "firebase/auth";

import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";

import { useAuth } from "@/providers/AuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import DefaultLayout from "@/layouts/default";
import { EditIcon } from "@/components/icons";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const { isSupported, requestPermission, getToken, sendTestNotification } = useNotifications();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.uid) {
      // Check if notifications are enabled for this user and device
      const deviceId = getDeviceId();
      const storageKey = `notifications_${user.uid}_${deviceId}`;
      const enabled = localStorage.getItem(storageKey) === "true";
      setNotificationsEnabled(enabled);
    }
  }, [user?.uid]);

  const getDeviceId = () => {
    // Create a simple device identifier based on user agent and screen info
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext('2d');
    ctx?.fillText(navigator.userAgent + screen.width + screen.height, 0, 0);
    return btoa(canvas.toDataURL()).slice(0, 16);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!user?.uid || !isSupported) return;

    setNotificationLoading(true);
    try {
      if (enabled) {
        // Request permission and get token
        const permissionResult = await requestPermission();
        if (permissionResult === 'granted') {
          await getToken();

          // Store device-specific setting
          const deviceId = getDeviceId();
          const storageKey = `notifications_${user.uid}_${deviceId}`;
          localStorage.setItem(storageKey, 'true');
          setNotificationsEnabled(true);

          // Send test notification after 3 seconds
          setTimeout(async () => {
            try {
              await sendTestNotification({
                title: 'Push Notifications Enabled! 🎉',
                body: 'Welcome to HealthTrackerAI notifications. You\'ll receive updates about your health tracking.',
                icon: '/favicon.ico',
                tag: 'welcome-notification',
                requireInteraction: false,
              });
            } catch (error) {
              console.error('Failed to send test notification:', error);
            }
          }, 3000);
        } else {
          alert('Notification permission denied. Please enable notifications in your browser settings.');
        }
      } else {
        // Disable notifications for this device
        const deviceId = getDeviceId();
        const storageKey = `notifications_${user.uid}_${deviceId}`;
        localStorage.removeItem(storageKey);
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Failed to update notification settings. Please try again.');
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim() || null,
      });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">My Profile</h1>
          <p className="text-center text-default-600">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Overview Card */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-col items-center gap-4 pb-2 relative">
              <Button
                isIconOnly
                aria-label="Edit profile"
                className="absolute top-4 right-4"
                size="sm"
                variant="light"
                onPress={() => setIsEditing(!isEditing)}
              >
                <EditIcon size={16} />
              </Button>
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-semibold text-gray-600 dark:text-gray-300"
                  role="img"
                  aria-label={`${(user.displayName || user.email || "U")
                    .charAt(0)
                    .toUpperCase()} avatar`}
                  title={`${(user.displayName || user.email || "U")
                    .charAt(0)
                    .toUpperCase()} avatar`}
                >
                  {(user.displayName || user.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-semibold">
                  {user.displayName || "User"}
                </h2>
                <p className="text-default-600">{user.email}</p>
              </div>
            </CardHeader>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Account Information</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <span className="text-sm font-medium text-default-600">Email</span>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-default-600">Display Name</span>
                {isEditing ? (
                  <div className="flex gap-2 mt-2">
                    <Input
                      className="flex-1"
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      size="sm"
                      value={displayName}
                    />
                    <Button
                      color="primary"
                      isLoading={updating}
                      onPress={handleUpdateProfile}
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        setIsEditing(false);
                        setDisplayName(user.displayName || "");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <p className="text-lg">{user.displayName || "Not set"}</p>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-default-600">Account Created</span>
                <p className="text-lg">
                  {user.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-default-600">Last Sign In</span>
                <p className="text-lg">
                  {user.metadata?.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Account Settings</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <span className="text-sm font-medium text-default-600">Email Verified</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${user.emailVerified ? 'bg-success' : 'bg-warning'}`}></div>
                  <span>{user.emailVerified ? "Verified" : "Not verified"}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-default-600">Provider</span>
                <p className="text-lg capitalize">
                  {user.providerData?.[0]?.providerId?.replace('.com', '') || "Email"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-default-600">Push Notifications</span>
                  <p className="text-xs text-default-500">
                    {isSupported ? "Receive notifications on this device" : "Not supported on this browser"}
                  </p>
                </div>
                <Switch
                  isDisabled={!isSupported || notificationLoading}
                  isSelected={notificationsEnabled}
                  size="sm"
                  onValueChange={handleNotificationToggle}
                />
              </div>
              <div>
                <span className="text-sm font-medium text-default-600">UID</span>
                <p className="text-sm font-mono bg-default-100 p-2 rounded break-all">
                  {user.uid}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            color="primary"
            variant="flat"
            onPress={() => router.push("/")}
          >
            Back to Home
          </Button>
          <Button
            color="danger"
            variant="flat"
            onPress={() => {
              // This would typically open a confirmation modal
              if (confirm("Are you sure you want to sign out?")) {
                // Sign out logic would be handled by the navbar
                router.push("/");
              }
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </DefaultLayout>
  );
}