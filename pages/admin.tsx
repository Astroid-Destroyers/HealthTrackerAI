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
  devices: Device[];
}

interface Device {
  id: string;
  userAgent: string;
  lastLogin: string;
  notificationsEnabled: boolean;
  deviceType: string;
}

const ADMIN_EMAIL = "new.roeepalmon@gmail.com";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

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
                      <TableColumn>Devices</TableColumn>
                      <TableColumn>Actions</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.uid}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.displayName || "N/A"}</TableCell>
                          <TableCell>{user.devices.length}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => setSelectedUser(user)}
                            >
                              Manage
                            </Button>
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
                  <h3 className="text-lg font-semibold text-white">
                    {selectedUser.email}&apos;s Devices
                  </h3>
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
      </div>
    </DefaultLayout>
  );
}
