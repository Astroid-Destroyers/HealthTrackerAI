import type { NextApiRequest, NextApiResponse } from "next";

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const ADMIN_EMAIL = "new.roeepalmon@gmail.com";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Initialize Firebase Admin SDK if not already initialized
  if (!getApps().length) {
    try {
      const projectId = process.env.FB_PROJECT_ID;
      const clientEmail = process.env.FB_CLIENT_EMAIL;
      const privateKey = process.env.FB_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        return res.status(500).json({
          error: "Firebase Admin environment variables not configured",
        });
      }

      // Clean the private key
      const cleanPrivateKey = privateKey
        .replace(/\\n/g, "\n")
        .replace(/^"|"$/g, "");

      const app = initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: cleanPrivateKey,
        }),
        projectId: projectId,
      });

      var db = getFirestore(app);
      var auth = getAuth(app);
      var messaging = getMessaging(app);
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);

      return res
        .status(500)
        .json({ error: "Failed to initialize Firebase Admin SDK" });
    }
  } else {
    // Use existing app
    const app = getApps()[0];
    var db = getFirestore(app);
    var auth = getAuth(app);
    var messaging = getMessaging(app);
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    if (decodedToken.email !== ADMIN_EMAIL) {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required" });
    }

    const { userId, deviceId, message } = req.body;

    if (!userId || !deviceId || !message || !message.trim()) {
      return res
        .status(400)
        .json({ error: "Missing required fields: userId, deviceId, message" });
    }

    // Get device FCM token
    const deviceRef = db
      .collection("users")
      .doc(userId)
      .collection("devices")
      .doc(deviceId);
    const deviceDoc = await deviceRef.get();

    if (!deviceDoc.exists) {
      return res.status(404).json({ error: "Device not found" });
    }

    const deviceData = deviceDoc.data();
    const fcmToken = deviceData?.fcmToken;

    if (!fcmToken) {
      return res.status(400).json({ error: "Device does not have FCM token" });
    }

    // Send FCM message
    await messaging.send({
      token: fcmToken,
      notification: {
        title: "Admin Message",
        body: message.trim(),
      },
      data: {
        type: "admin_message",
        sentBy: "admin",
        timestamp: Date.now().toString(),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "admin_messages",
          priority: "high",
          defaultVibrateTimings: true,
          defaultSound: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: "Admin Message",
              body: message.trim(),
            },
            sound: "default",
            badge: 1,
          },
        },
      },
    });

    // Log the message
    await db.collection("admin_messages").add({
      userId,
      deviceId,
      message: message.trim(),
      sentBy: decodedToken.uid,
      sentAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
