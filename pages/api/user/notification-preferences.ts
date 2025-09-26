import { NextApiRequest, NextApiResponse } from "next";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
let auth: any = null;
let db: any = null;

if (!getApps().length) {
  try {
    const projectId = process.env.FB_PROJECT_ID;
    const clientEmail = process.env.FB_CLIENT_EMAIL;
    const privateKey = process.env.FB_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin SDK environment variables");
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

auth = getAuth();
db = getFirestore();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { deviceId, enabled, fcmToken, userAgent, deviceInfo } = req.body;

    if (!deviceId || typeof enabled !== "boolean") {
      return res.status(400).json({ 
        error: "Missing required fields: deviceId, enabled" 
      });
    }

    console.log(`User ${userId} updating notification preferences:`, {
      deviceId,
      enabled,
      fcmTokenPresent: !!fcmToken,
      userAgent: userAgent?.slice(0, 50) || "unknown"
    });

    // Update device notification status in user's devices collection
    const deviceRef = db
      .collection("users")
      .doc(userId)
      .collection("devices")
      .doc(deviceId);

    const updateData: any = {
      notificationsEnabled: enabled,
      lastUpdated: FieldValue.serverTimestamp(),
    };

    // If enabling notifications, store additional device info
    if (enabled && fcmToken) {
      updateData.fcmToken = fcmToken;
      updateData.userAgent = userAgent;
      updateData.deviceInfo = deviceInfo;
      updateData.lastTokenUpdate = FieldValue.serverTimestamp();
    } else if (!enabled) {
      // If disabling, remove FCM token
      updateData.fcmToken = null;
    }

    await deviceRef.set(updateData, { merge: true });

    // Also update the user's main document to track overall notification preference
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    let notificationPreferences: any = {};
    if (userDoc.exists()) {
      notificationPreferences = userDoc.data()?.notificationPreferences || {};
    }

    // Update the notification preferences for this device
    notificationPreferences[deviceId] = {
      enabled,
      lastUpdated: new Date().toISOString(),
      deviceInfo: deviceInfo?.platform || "unknown"
    };

    await userRef.set({
      notificationPreferences,
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Notification preferences updated for user ${userId}, device ${deviceId}: ${enabled ? 'enabled' : 'disabled'}`);

    return res.status(200).json({
      success: true,
      message: `Notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      deviceId,
      enabled,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error updating notification preferences:", error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
}