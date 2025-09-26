import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
// Firebase imports for profile updates
import { updateProfile } from "firebase/auth";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  linkWithCredential 
} from "firebase/auth";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";

import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import DefaultLayout from "@/layouts/default";

interface UserProfile {
  name: string;
  gender: string;
  height: {
    feet: string;
    inches: string;
    cm: string;
    unit: "imperial" | "metric";
  };
  weight: {
    pounds: string;
    kg: string;
    unit: "imperial" | "metric";
  };
  goal: string;
  email: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);

  // New state for user profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Phone verification states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  useEffect(() => {
    // Detect mobile devices and Chrome
    const mobileCheck =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const chromeCheck =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    setIsMobile(mobileCheck);
    setIsChrome(chromeCheck);
  }, []);

  const { isSupported, requestPermission, getToken, sendTestNotification } =
    useNotifications();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;

      setProfileLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          console.log('Profile data loaded:', profileData); // Debug log
          setUserProfile(profileData);
          
          // Initialize phone number field if user has one
          if (profileData.phoneNumber) {
            setPhoneNumber(profileData.phoneNumber);
          }
        } else {
          console.log('No profile document found for user'); // Debug log
        }
      } catch {
        // Error fetching user profile
      } finally {
        setProfileLoading(false);
      }
    };

    if (user?.uid) {
      fetchUserProfile();
    }
  }, [user?.uid]);

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [recaptchaVerifier]);

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
    const ctx = canvas.getContext("2d");

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

        if (permissionResult === "granted") {
          const fcmToken = await getToken();

          // Store device-specific setting
          const deviceId = getDeviceId();
          const storageKey = `notifications_${user.uid}_${deviceId}`;

          localStorage.setItem(storageKey, "true");
          setNotificationsEnabled(true);

          // Call backend API to store device info
          try {
            const response = await fetch("/api/admin/toggle-notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await user.getIdToken()}`,
              },
              body: JSON.stringify({
                userId: user.uid,
                deviceId: deviceId,
                enabled: true,
                fcmToken: fcmToken,
                userAgent: navigator.userAgent,
                deviceInfo: {
                  platform: navigator.platform,
                  language: navigator.language,
                  screenWidth: screen.width,
                  screenHeight: screen.height,
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
              }),
            });

            if (!response.ok) {
              // Failed to update device info on backend
            }
          } catch {
            // Error calling toggle-notifications API
          }

          // Send test notification after 3 seconds
          setTimeout(async () => {
            try {
              await sendTestNotification({
                title: "Push Notifications Enabled! 🎉",
                body: "Welcome to HealthTrackerAI notifications. You'll receive updates about your health tracking.",
                icon: "/favicon.ico",
                tag: "welcome-notification",
                requireInteraction: false,
              });
            } catch {
              // Failed to send test notification
            }
          }, 3000);
        } else {
          alert(
            "Notification permission denied. Please enable notifications in your browser settings.",
          );
        }
      } else {
        // Disable notifications for this device
        const deviceId = getDeviceId();
        const storageKey = `notifications_${user.uid}_${deviceId}`;

        localStorage.removeItem(storageKey);
        setNotificationsEnabled(false);

        // Call backend API to disable notifications
        try {
          const response = await fetch("/api/admin/toggle-notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({
              userId: user.uid,
              deviceId: deviceId,
              enabled: false,
            }),
          });

          if (!response.ok) {
            // Failed to update device info on backend
          }
        } catch {
          // Error calling toggle-notifications API
        }
      }
    } catch {
      // Error toggling notifications
      alert("Failed to update notification settings. Please try again.");
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
      alert("Profile updated successfully!");
    } catch {
      // Error updating profile
      alert("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Helper functions to format profile data
  const formatHeight = (height: UserProfile["height"]) => {
    if (!height) return "Not provided";

    if (height.unit === "imperial") {
      const feet = height.feet || "0";
      const inches = height.inches || "0";

      return `${feet}' ${inches}"`;
    } else {
      return `${height.cm || "0"} cm`;
    }
  };

  const formatWeight = (weight: UserProfile["weight"]) => {
    if (!weight) return "Not provided";

    if (weight.unit === "imperial") {
      return `${weight.pounds || "0"} lbs`;
    } else {
      return `${weight.kg || "0"} kg`;
    }
  };

  const formatGoal = (goal: string) => {
    const goalMap: { [key: string]: string } = {
      "lose-weight": "Lose Weight",
      "gain-weight": "Gain Weight",
      "maintain-weight": "Maintain Weight",
    };

    return goalMap[goal] || goal;
  };

  const formatGender = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      male: "Male",
      female: "Female",
      "prefer-not-to-say": "Prefer not to say",
    };

    return genderMap[gender] || gender;
  };

  // Phone verification functions
  const initializeRecaptcha = () => {
    if (!recaptchaVerifier && typeof window !== 'undefined') {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber
        },
      });
      setRecaptchaVerifier(verifier);
      return verifier;
    }
    return recaptchaVerifier;
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim() || phoneLoading) return;

    try {
      setPhoneLoading(true);
      
      // Initialize reCAPTCHA
      const appVerifier = initializeRecaptcha();
      
      if (!appVerifier) {
        alert('Failed to initialize reCAPTCHA. Please refresh and try again.');
        return;
      }
      
      // Format phone number (add +1 if not present for US numbers)
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+1${phoneNumber.replace(/\D/g, '')}`;

      console.log('Attempting to send SMS to:', formattedPhone);

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setCodeSent(true);
      alert('Verification code sent to your phone!');
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/invalid-app-credential') {
        alert('Phone authentication is not properly configured in Firebase Console. Please enable Phone Authentication and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        alert('Too many requests. Please wait before trying again.');
      } else if (error.code === 'auth/invalid-phone-number') {
        alert('Invalid phone number format. Please use format: (555) 123-4567');
      } else {
        alert(`Failed to send verification code: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const verifyPhoneNumber = async () => {
    if (!confirmationResult || !verificationCode.trim() || isVerifying) return;

    try {
      setIsVerifying(true);
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, verificationCode);
      
      if (user) {
        // Link the phone credential to existing user
        await linkWithCredential(user, credential);
        
        // Update user profile in Firestore
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          phoneNumber: phoneNumber,
          phoneVerified: true,
          updatedAt: new Date(),
        });

        // Update local state
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            phoneNumber: phoneNumber,
            phoneVerified: true,
          });
        }

        alert('Phone number verified successfully!');
        setCodeSent(false);
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Error verifying phone number:', error);
      alert('Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  if (loading || profileLoading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading profile...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // If no profile data exists, show a simplified version with just phone verification
  if (!userProfile) {
    return (
      <DefaultLayout>
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          <div className="relative z-10 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">Profile Setup</h1>
                <p className="text-gray-400">Complete your profile to get started</p>
              </div>
              
              {/* Phone Verification Card */}
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <span className="text-white text-xl">📱</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Phone Verification</h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-6">
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Phone Number
                      </span>
                    </div>
                    
                    <div className="pl-4 space-y-3">
                      <Input
                        className="max-w-xs"
                        classNames={{
                          input: "text-white placeholder:text-gray-400",
                          inputWrapper: "backdrop-blur-xl bg-white/5 border-white/20 hover:border-white/30 group-data-[focus=true]:border-white/40",
                        }}
                        placeholder="(555) 123-4567"
                        size="sm"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setPhoneNumber(formatted);
                        }}
                      />
                      
                      {!codeSent ? (
                        <Button
                          className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold"
                          isDisabled={!phoneNumber.trim() || phoneLoading}
                          isLoading={phoneLoading}
                          size="sm"
                          onClick={sendVerificationCode}
                        >
                          Send Verification Code
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            className="max-w-xs"
                            classNames={{
                              input: "text-white placeholder:text-gray-400",
                              inputWrapper: "backdrop-blur-xl bg-white/5 border-white/20 hover:border-white/30 group-data-[focus=true]:border-white/40",
                            }}
                            placeholder="Enter 6-digit code"
                            size="sm"
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold"
                              isDisabled={!verificationCode.trim() || isVerifying}
                              isLoading={isVerifying}
                              size="sm"
                              onClick={verifyPhoneNumber}
                            >
                              Verify Code
                            </Button>
                            <Button
                              className="text-gray-400 hover:text-white"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCodeSent(false);
                                setVerificationCode('');
                                setConfirmationResult(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* reCAPTCHA container */}
                      <div id="recaptcha-container" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      {/* Hero Section with Background */}
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 pt-24 pb-12 px-6">
          <div className="container mx-auto max-w-7xl">
            {/* Header Section */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-2xl mx-auto profile-avatar-glow">
                  {(
                    user?.displayName?.[0] ||
                    user?.email?.[0] ||
                    "?"
                  ).toUpperCase()}
                </div>
                {userProfile && (
                  <motion.div
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                    initial={{ scale: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  </motion.div>
                )}
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {userProfile?.name || user.displayName || "User"}
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-2">{user.email}</p>
              {userProfile && (
                <Chip
                  className="backdrop-blur-xl bg-green-500/20 border border-green-400/30 text-green-300"
                  size="lg"
                  variant="bordered"
                >
                  🎯 Health Profile Active
                </Chip>
              )}
            </motion.div>

            {userProfile ? (
              <>
                {/* Stats Overview */}
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">👤</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">
                      Gender
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatGender(userProfile.gender)}
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">📏</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">
                      Height
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatHeight(userProfile.height)}
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">⚖️</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">
                      Weight
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatWeight(userProfile.weight)}
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">
                      Goal
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatGoal(userProfile.goal)}
                    </div>
                  </div>
                </motion.div>

                {/* Detailed Information Cards */}
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {/* Personal Information */}
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xl">👤</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Personal Info
                        </h3>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-6">
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Full Name
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-white pl-4">
                          {userProfile.name}
                        </p>
                      </div>
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-purple-400" />
                          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Gender
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-white pl-4">
                          {formatGender(userProfile.gender)}
                        </p>
                      </div>
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-pink-400" />
                          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Email
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-white pl-4 break-all">
                          {userProfile.email}
                        </p>
                      </div>
                      
                      {/* Phone Number Section */}
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Phone Number
                          </span>
                          {userProfile.phoneVerified && (
                            <Chip
                              className="bg-emerald-500/20 text-emerald-300 border-emerald-400/20"
                              size="sm"
                              variant="bordered"
                            >
                              ✓ Verified
                            </Chip>
                          )}
                        </div>
                        
                        {/* Always show phone input for now - for debugging */}
                        <div className="pl-4 space-y-3">
                          <Input
                            className="max-w-xs"
                            classNames={{
                              input: "text-white placeholder:text-gray-400",
                              inputWrapper: "backdrop-blur-xl bg-white/5 border-white/20 hover:border-white/30 group-data-[focus=true]:border-white/40",
                            }}
                            placeholder="(555) 123-4567"
                            size="sm"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              setPhoneNumber(formatted);
                            }}
                          />
                          
                          {!codeSent ? (
                            <Button
                              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold"
                              isDisabled={!phoneNumber.trim() || phoneLoading}
                              isLoading={phoneLoading}
                              size="sm"
                              onClick={sendVerificationCode}
                            >
                              Send Code
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                className="max-w-xs"
                                classNames={{
                                  input: "text-white placeholder:text-gray-400",
                                  inputWrapper: "backdrop-blur-xl bg-white/5 border-white/20 hover:border-white/30 group-data-[focus=true]:border-white/40",
                                }}
                                placeholder="Enter 6-digit code"
                                size="sm"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                              />
                              <Button
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold mr-2"
                                isDisabled={!verificationCode.trim() || isVerifying}
                                isLoading={isVerifying}
                                size="sm"
                                onClick={verifyPhoneNumber}
                              >
                                Verify
                              </Button>
                              <Button
                                className="text-gray-400 hover:text-white"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setCodeSent(false);
                                  setVerificationCode('');
                                  setConfirmationResult(null);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                          
                          {/* reCAPTCHA container */}
                          <div id="recaptcha-container" />
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Physical Measurements */}
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/10">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white text-xl">📊</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Physical Stats
                        </h3>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-6">
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Height
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-white pl-4">
                          {formatHeight(userProfile.height)}
                        </p>
                        <p className="text-xs text-gray-500 pl-4">
                          {userProfile.height?.unit === "imperial"
                            ? "Imperial System"
                            : "Metric System"}
                        </p>
                      </div>
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Weight
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-white pl-4">
                          {formatWeight(userProfile.weight)}
                        </p>
                        <p className="text-xs text-gray-500 pl-4">
                          {userProfile.weight?.unit === "imperial"
                            ? "Imperial System"
                            : "Metric System"}
                        </p>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Health Goals & Timeline */}
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/10 lg:col-span-2 xl:col-span-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                          <span className="text-white text-xl">🎯</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Health Goals
                        </h3>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-6">
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Primary Goal
                          </span>
                        </div>
                        <div className="pl-4">
                          <Chip
                            className={`
                              ${userProfile.goal === "lose-weight" ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/30 text-orange-300" : ""}
                              ${userProfile.goal === "gain-weight" ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300" : ""}
                              ${userProfile.goal === "maintain-weight" ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-400/30 text-blue-300" : ""}
                              backdrop-blur-xl border text-lg px-6 py-2
                            `}
                            size="lg"
                            variant="bordered"
                          >
                            {formatGoal(userProfile.goal)}
                          </Chip>
                        </div>
                      </div>
                      <div className="group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                            Journey Started
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white pl-4">
                          {userProfile.createdAt
                            ? new Date(
                                userProfile.createdAt.seconds * 1000,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Unknown"}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              </>
            ) : (
              /* No Profile Data - Enhanced Design */
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 max-w-2xl mx-auto">
                  <CardBody className="text-center py-16">
                    <div className="text-8xl mb-6 opacity-50">📋</div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      No Health Profile Found
                    </h3>
                    <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-md mx-auto">
                      Create a comprehensive health profile to unlock AI-powered
                      insights and personalized recommendations.
                    </p>
                    <Button
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-8 py-6 text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                      size="lg"
                      onClick={() => router.push("/")}
                    >
                      Create Health Profile
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center gap-6 mt-12"
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button
                className="backdrop-blur-xl bg-white/10 border border-white/20 text-white font-medium px-8 py-6 text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
                size="lg"
                variant="bordered"
                onPress={() => router.push("/")}
              >
                ← Back to Home
              </Button>
              <Button
                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 text-red-300 font-medium px-8 py-6 text-lg hover:bg-red-500/30 transition-all duration-300 hover:scale-105"
                size="lg"
                variant="bordered"
                onPress={() => {
                  if (confirm("Are you sure you want to sign out?")) {
                    router.push("/");
                  }
                }}
              >
                Sign Out →
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
