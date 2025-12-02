import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";

import { useAuth } from "@/providers/AuthProvider";
import DefaultLayout from "@/layouts/default";

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  phoneNumber?: string;
  phoneVerified?: boolean;
  devices: Device[];
  notificationPreferences?: Record<string, any>;
  notificationEnabledDevices?: number;
  hasValidFcmTokens?: boolean;
}

interface Device {
  id: string;
  userAgent: string;
  lastLogin: string;
  notificationsEnabled: boolean;
  deviceType: string;
}

const ADMIN_EMAIL = "admin@healthtrackerai.com";

// Helper function to format phone numbers
const formatPhoneNumber = (phoneNumber: string) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumber;
};

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // SMS functionality state
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);

  // FCM functionality state
  const [showFcmModal, setShowFcmModal] = useState(false);
  const [fcmTitle, setFcmTitle] = useState("");
  const [fcmMessage, setFcmMessage] = useState("");
  const [sendingFcm, setSendingFcm] = useState(false);

  // Email functionality state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Load all users and their devices
  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    if (!user) return;

    setLoadingUsers(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        setUsers(data.users);
      }
    } catch {
      // Failed to load users
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleDeviceNotifications = async (
    userId: string,
    deviceId: string,
    enabled: boolean,
  ) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/toggle-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId, deviceId, enabled }),
      });

      if (response.ok) {
        // Refresh users data
        loadUsers();
      }
    } catch {
      // Failed to toggle notifications
    }
  };

  const sendCustomMessage = async () => {
    if (!selectedUser || !selectedDevice || !customMessage.trim() || !user)
      return;

    setSendingMessage(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.uid,
          deviceId: selectedDevice.id,
          message: customMessage.trim(),
        }),
      });

      if (response.ok) {
        setCustomMessage("");
        alert("Message sent successfully!");
      } else {
        alert("Failed to send message");
      }
    } catch {
      // Failed to send message
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const sendSmsMessage = async () => {
    if (
      !selectedUser ||
      !selectedUser.phoneNumber ||
      !smsMessage.trim() ||
      !user
    )
      return;

    setSendingSms(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.uid,
          phoneNumber: selectedUser.phoneNumber,
          message: smsMessage.trim(),
        }),
      });

      if (response.ok) {
        setSmsMessage("");
        setShowSmsModal(false);
        alert("SMS sent successfully!");
      } else {
        const errorData = await response.json();

        alert(`Failed to send SMS: ${errorData.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to send SMS");
    } finally {
      setSendingSms(false);
    }
  };

  const sendFcmMessage = async () => {
    if (
      !selectedUser ||
      !selectedUser.devices ||
      selectedUser.devices.length === 0 ||
      !fcmTitle.trim() ||
      !fcmMessage.trim() ||
      !user
    )
      return;

    setSendingFcm(true);
    try {
      const idToken = await user.getIdToken();

      // Only get tokens from devices that have notifications enabled
      const enabledDevices = selectedUser.devices.filter((device: any) =>
        device.notificationsEnabled === true && device.fcmToken
      );

      if (enabledDevices.length === 0) {
        alert("This user has no devices with notifications enabled");
        setSendingFcm(false);
        return;
      }

      const deviceTokens = enabledDevices.map((device: any) => device.fcmToken);

      const response = await fetch("/api/admin/send-fcm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.uid,
          deviceTokens,
          title: fcmTitle.trim(),
          message: fcmMessage.trim(),
          data: {
            type: "admin_notification",
            timestamp: Date.now().toString(),
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setFcmTitle("");
        setFcmMessage("");
        setShowFcmModal(false);
        alert(`FCM notification sent! Success: ${result.successCount}, Failed: ${result.failureCount}`);
      } else {
        const errorData = await response.json();

        alert(`Failed to send FCM notification: ${errorData.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to send FCM notification");
    } finally {
      setSendingFcm(false);
    }
  };

  const sendEmail = async () => {
    if (
      !selectedUser ||
      !selectedUser.email ||
      !emailSubject.trim() ||
      !emailMessage.trim() ||
      !user
    )
      return;

    setSendingEmail(true);
    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: emailSubject.trim(),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">HealthTrackerAI</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Health Management Platform</p>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333; margin-bottom: 20px;">${emailSubject}</h2>
                <div style="color: #555; line-height: 1.6;">
                  ${emailMessage.replace(/\n/g, '<br>')}
                </div>
              </div>
              <div style="padding: 20px; text-align: center; background: #333; color: #ccc;">
                <p style="margin: 0; font-size: 14px;">
                  This email was sent from HealthTrackerAI Admin Panel<br>
                  <a href="https://healthtrackerai.xyz" style="color: #667eea; text-decoration: none;">healthtrackerai.xyz</a>
                </p>
              </div>
            </div>
          `,
          text: `${emailSubject}\n\n${emailMessage}\n\n---\nThis email was sent from HealthTrackerAI Admin Panel\nhealthtrackerai.xyz`,
        }),
      });

      if (response.ok) {
        setEmailSubject("");
        setEmailMessage("");
        setShowEmailModal(false);
        alert("Email sent successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to send email: ${errorData.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const getDeviceType = (userAgent: string) => {
    if (
      userAgent.includes("Mobile") ||
      userAgent.includes("Android") ||
      userAgent.includes("iPhone")
    ) {
      return "Mobile";
    }

    return "Desktop";
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading admin panel...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </h1>
          <p className="text-center text-gray-400 text-lg">
            Manage users and their devices
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
              <CardHeader className="border-b border-white/10">
                <h3 className="text-xl font-semibold text-white">
                  All Users ({users.length})
                </h3>
              </CardHeader>
              <CardBody>
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p>Loading users...</p>
                  </div>
                ) : (
                  <Table
                    aria-label="Users table"
                    className="backdrop-blur-xl bg-transparent"
                    classNames={{
                      wrapper: "bg-transparent shadow-none",
                      th: "bg-white/10 text-white font-semibold border-b border-white/10",
                      td: "text-gray-300 border-b border-white/5",
                    }}
                  >
                    <TableHeader>
                      <TableColumn>Email</TableColumn>
                      <TableColumn>Name</TableColumn>
                      <TableColumn>Phone</TableColumn>
                      <TableColumn>Devices</TableColumn>
                      <TableColumn>Notifications</TableColumn>
                      <TableColumn>Actions</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.uid}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.displayName || "N/A"}</TableCell>
                          <TableCell>
                            {user.phoneNumber ? (
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400">
                                  {formatPhoneNumber(user.phoneNumber)}
                                </span>
                                {user.phoneVerified && (
                                  <span className="text-emerald-300 text-xs">
                                    ✓
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">No phone</span>
                            )}
                          </TableCell>
                          <TableCell>{user.devices.length}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.hasValidFcmTokens ? (
                                <>
                                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                                  <span className="text-green-400 text-sm">
                                    Enabled ({user.notificationEnabledDevices})
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                                  <span className="text-gray-500 text-sm">
                                    Disabled
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={() => setSelectedUser(user)}
                              >
                                Manage
                              </Button>
                              {user.phoneNumber && (
                                <Button
                                  color="secondary"
                                  size="sm"
                                  variant="flat"
                                  onPress={() => {
                                    setSelectedUser(user);
                                    setShowSmsModal(true);
                                  }}
                                >
                                  SMS
                                </Button>
                              )}
                              {user.hasValidFcmTokens && (
                                <Button
                                  color="primary"
                                  size="sm"
                                  variant="flat"
                                  onPress={() => {
                                    setSelectedUser(user);
                                    setShowFcmModal(true);
                                  }}
                                >
                                  Push
                                </Button>
                              )}
                              {user.email && (
                                <Button
                                  color="success"
                                  size="sm"
                                  variant="flat"
                                  onPress={() => {
                                    setSelectedUser(user);
                                    setShowEmailModal(true);
                                  }}
                                >
                                  Email
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </div>

          {/* User Device Management */}
          <div>
            {selectedUser ? (
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                <CardHeader className="border-b border-white/10">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedUser.email}&apos;s Devices
                    </h3>
                    {selectedUser.phoneNumber && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-400">Phone:</span>
                        <span className="text-emerald-400 text-sm">
                          {formatPhoneNumber(selectedUser.phoneNumber)}
                        </span>
                        {selectedUser.phoneVerified && (
                          <span className="text-emerald-300 text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  {selectedUser.devices.map((device) => (
                    <div
                      key={device.id}
                      className="border border-white/10 rounded-xl p-4 backdrop-blur-xl bg-white/5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm text-white">
                            {getDeviceType(device.userAgent)} Device
                          </p>
                          <p className="text-xs text-gray-400">
                            Last login:{" "}
                            {new Date(device.lastLogin).toLocaleString()}
                          </p>
                        </div>
                        <Switch
                          isSelected={device.notificationsEnabled}
                          size="sm"
                          onValueChange={(enabled) =>
                            toggleDeviceNotifications(
                              selectedUser.uid,
                              device.id,
                              enabled,
                            )
                          }
                        />
                      </div>

                      <div className="text-xs text-gray-400 mb-2">
                        {device.userAgent.substring(0, 50)}...
                      </div>

                      <Button
                        className="w-full btn-ai-primary"
                        size="sm"
                        onPress={() => setSelectedDevice(device)}
                      >
                        Send Message
                      </Button>
                    </div>
                  ))}

                  <Button
                    className="w-full"
                    size="sm"
                    variant="ghost"
                    onPress={() => setSelectedUser(null)}
                  >
                    Close
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                <CardBody className="text-center py-8">
                  <p className="text-gray-400">
                    Select a user to manage their devices
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {/* Send Custom Message Modal */}
        {selectedDevice && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md backdrop-blur-xl bg-slate-900/95 border border-white/20 shadow-2xl">
              <CardHeader className="border-b border-white/10">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Send Custom Message
                  </h3>
                  <p className="text-sm text-gray-400">
                    To {selectedUser.email} on{" "}
                    {getDeviceType(selectedDevice.userAgent)} device
                  </p>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Message"
                  maxLength={200}
                  placeholder="Enter your custom message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    isDisabled={!customMessage.trim()}
                    isLoading={sendingMessage}
                    onPress={sendCustomMessage}
                  >
                    Send Message
                  </Button>
                  <Button
                    variant="flat"
                    onPress={() => setSelectedDevice(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Send SMS Modal */}
        {showSmsModal && selectedUser && selectedUser.phoneNumber && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md backdrop-blur-xl bg-slate-900/95 border border-white/20 shadow-2xl">
              <CardHeader className="border-b border-white/10">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Send SMS Message
                  </h3>
                  <p className="text-sm text-gray-400">
                    To {selectedUser.email} at{" "}
                    <span className="font-mono">
                      {formatPhoneNumber(selectedUser.phoneNumber)}
                    </span>
                  </p>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-200"
                    htmlFor="sms-message"
                  >
                    SMS Message
                  </label>

                  {/* Quick Templates */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 text-gray-300"
                      type="button"
                      onClick={() =>
                        setSmsMessage(
                          "Hi! This is a message from HealthTrackerAI. Please confirm you received this notification.",
                        )
                      }
                    >
                      Confirmation
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 text-gray-300"
                      type="button"
                      onClick={() =>
                        setSmsMessage(
                          "Reminder: Please log your health metrics in the HealthTrackerAI app today.",
                        )
                      }
                    >
                      Reminder
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 text-gray-300"
                      type="button"
                      onClick={() =>
                        setSmsMessage(
                          "Welcome to HealthTrackerAI! Your account has been successfully set up.",
                        )
                      }
                    >
                      Welcome
                    </button>
                  </div>

                  <textarea
                    className="w-full min-h-[100px] p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    id="sms-message"
                    maxLength={160}
                    placeholder="Enter your SMS message... Tip: Use natural, complete sentences to avoid carrier filtering."
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                      {smsMessage.length}/160 characters
                    </p>
                    {smsMessage.length > 160 && (
                      <p className="text-xs text-red-400">Message too long</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    isDisabled={!smsMessage.trim() || smsMessage.length > 160}
                    isLoading={sendingSms}
                    onPress={sendSmsMessage}
                  >
                    {sendingSms ? "Sending..." : "Send SMS"}
                  </Button>
                  <Button
                    className="px-6"
                    variant="flat"
                    onPress={() => {
                      setShowSmsModal(false);
                      setSmsMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Send FCM Modal */}
        {showFcmModal && selectedUser && selectedUser.hasValidFcmTokens && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md backdrop-blur-xl bg-slate-900/95 border border-white/20 shadow-2xl">
              <CardHeader className="border-b border-white/10">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Send Push Notification
                  </h3>
                  <p className="text-sm text-gray-400">
                    To {selectedUser.email} on {selectedUser.devices.length} device(s)
                  </p>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="space-y-4">
                  {/* Title Input */}
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-200"
                      htmlFor="fcm-title"
                    >
                      Notification Title
                    </label>
                    <input
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="fcm-title"
                      maxLength={50}
                      placeholder="Enter notification title..."
                      value={fcmTitle}
                      onChange={(e) => setFcmTitle(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">
                      {fcmTitle.length}/50 characters
                    </p>
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-200"
                      htmlFor="fcm-message"
                    >
                      Notification Message
                    </label>
                    <textarea
                      className="w-full min-h-[100px] p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="fcm-message"
                      maxLength={200}
                      placeholder="Enter your notification message..."
                      value={fcmMessage}
                      onChange={(e) => setFcmMessage(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">
                      {fcmMessage.length}/200 characters
                    </p>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-200">Quick Templates:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 text-gray-300"
                        type="button"
                        onClick={() => {
                          setFcmTitle("Health Reminder");
                          setFcmMessage("Don't forget to log your daily health metrics!");
                        }}
                      >
                        Health Reminder
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 text-gray-300"
                        type="button"
                        onClick={() => {
                          setFcmTitle("Welcome!");
                          setFcmMessage("Welcome to HealthTrackerAI! Start your health journey today.");
                        }}
                      >
                        Welcome
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 text-gray-300"
                        type="button"
                        onClick={() => {
                          setFcmTitle("Check-in Time");
                          setFcmMessage("Time for your daily health check-in. How are you feeling today?");
                        }}
                      >
                        Check-in
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    isDisabled={!fcmTitle.trim() || !fcmMessage.trim()}
                    isLoading={sendingFcm}
                    onPress={sendFcmMessage}
                  >
                    {sendingFcm ? "Sending..." : "Send Notification"}
                  </Button>
                  <Button
                    className="px-6"
                    variant="flat"
                    onPress={() => {
                      setShowFcmModal(false);
                      setFcmTitle("");
                      setFcmMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Send Email Modal */}
        {showEmailModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white/95 backdrop-blur-md shadow-2xl border-0 ring-1 ring-gray-200/50">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/30">
                <h3 className="text-xl font-semibold text-gray-900">
                  Send Email to {selectedUser.displayName || selectedUser.email}
                </h3>
                <p className="text-sm text-gray-600">
                  To: {selectedUser.email}
                </p>
              </CardHeader>
              <CardBody className="space-y-4 bg-white/90">
                <Input
                  classNames={{
                    base: "bg-white",
                    inputWrapper:
                      "bg-white border-gray-300 hover:border-blue-400 focus-within:border-blue-500 shadow-sm",
                    input: "text-gray-900",
                  }}
                  label="Subject"
                  placeholder="Enter email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />

                <div>
                  <label
                    className="block text-sm font-medium mb-2 text-gray-800"
                    htmlFor="email-message"
                  >
                    Message
                  </label>
                  <textarea
                    id="email-message"
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter your email message here..."
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  />
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 rounded-lg border border-gray-200/50 shadow-sm">
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    Quick Templates:
                  </p>
                  <div className="space-y-2">
                    <Button
                      className="text-left justify-start bg-white/70 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm"
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        setEmailSubject("Welcome to HealthTrackerAI!");
                        setEmailMessage(
                          "Welcome to HealthTrackerAI! We're excited to help you on your health journey. Start tracking your daily metrics and discover personalized insights.",
                        );
                      }}
                    >
                      Welcome Message
                    </Button>
                    <Button
                      className="text-left justify-start bg-white/70 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm"
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        setEmailSubject("Health Check-in Reminder");
                        setEmailMessage(
                          "Don't forget to log your daily health metrics! Consistent tracking helps us provide better insights and recommendations for your health journey.",
                        );
                      }}
                    >
                      Health Reminder
                    </Button>
                    <Button
                      className="text-left justify-start bg-white/70 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm"
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        setEmailSubject("New Features Available");
                        setEmailMessage(
                          "We've added new features to help you better track and understand your health data. Check them out in your dashboard!",
                        );
                      }}
                    >
                      Feature Update
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white rounded-b-lg -mx-6 px-6 -mb-6 pb-6">
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    isDisabled={!emailSubject.trim() || !emailMessage.trim()}
                    isLoading={sendingEmail}
                    onPress={sendEmail}
                  >
                    {sendingEmail ? "Sending..." : "Send Email"}
                  </Button>
                  <Button
                    className="px-6 bg-white/80 border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200"
                    variant="flat"
                    onPress={() => {
                      setShowEmailModal(false);
                      setEmailSubject("");
                      setEmailMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
