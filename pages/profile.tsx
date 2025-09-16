import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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
            <CardHeader className="flex flex-col items-center gap-4 pb-2">
              <Avatar
                src={user.photoURL || undefined}
                name={user.displayName || user.email || "User"}
                size="lg"
                className="w-24 h-24"
              />
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
                <label className="text-sm font-medium text-default-600">Email</label>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-default-600">Display Name</label>
                <p className="text-lg">{user.displayName || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-default-600">Account Created</label>
                <p className="text-lg">
                  {user.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-default-600">Last Sign In</label>
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
                <label className="text-sm font-medium text-default-600">Email Verified</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${user.emailVerified ? 'bg-success' : 'bg-warning'}`}></div>
                  <span>{user.emailVerified ? "Verified" : "Not verified"}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-default-600">Provider</label>
                <p className="text-lg capitalize">
                  {user.providerData?.[0]?.providerId?.replace('.com', '') || "Email"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-default-600">UID</label>
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