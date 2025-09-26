import { NextApiRequest, NextApiResponse } from "next";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

const ADMIN_EMAIL = "new.roeepalmon@gmail.com";

// Initialize Firebase Admin SDK
let auth: any = null;
let messaging: any = null;

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
messaging = getMessaging();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await auth.verifyIdToken(token);

    // Check if user is admin (same method as users API)
    if (decodedToken.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { userId, deviceTokens, title, message, data } = req.body;

    if (!userId || !deviceTokens || !Array.isArray(deviceTokens) || deviceTokens.length === 0) {
      return res.status(400).json({ error: "Missing userId or deviceTokens" });
    }

    if (!title || !message) {
      return res.status(400).json({ error: "Missing title or message" });
    }

    // Verify the user exists
    const targetUserRecord = await auth.getUser(userId);

    if (!targetUserRecord) {
      return res.status(400).json({ error: "User not found" });
    }

    // Send FCM notification
    try {
      console.log(`Attempting to send FCM notification:`);
      console.log(`- To User: ${targetUserRecord.email}`);
      console.log(`- Device Tokens: ${deviceTokens.length} tokens`);
      console.log(`- Device Tokens Array:`, deviceTokens);
      console.log(`- Title: "${title}"`);
      console.log(`- Message: "${message}"`);

      // Filter out null/undefined tokens
      const validTokens = deviceTokens.filter(token => token && token.trim().length > 0);
      console.log(`- Valid Tokens: ${validTokens.length}`, validTokens);

      if (validTokens.length === 0) {
        return res.status(400).json({ 
          error: "No valid FCM tokens found for this user. Make sure the user has registered devices with FCM tokens." 
        });
      }

      const fcmMessage = {
        notification: {
          title,
          body: message,
        },
        data: {
          userId,
          timestamp: Date.now().toString(),
          ...data,
        },
        tokens: validTokens,
      };

      const response = await messaging.sendEachForMulticast(fcmMessage);

      console.log(`FCM notification sent!`);
      console.log(`- Success Count: ${response.successCount}`);
      console.log(`- Failure Count: ${response.failureCount}`);

      if (response.failureCount > 0) {
        console.log(`- Failed Tokens:`, response.responses
          .filter((resp: any, idx: number) => !resp.success)
          .map((resp: any, idx: number) => ({
            token: deviceTokens[idx],
            error: resp.error?.message
          }))
        );
      }

      return res.status(200).json({
        success: true,
        message: "FCM notification sent successfully!",
        successCount: response.successCount,
        failureCount: response.failureCount,
        details: response.responses.map((resp: any, idx: number) => ({
          token: deviceTokens[idx],
          success: resp.success,
          messageId: resp.messageId,
          error: resp.error?.message,
        })),
      });
    } catch (fcmError: any) {
      console.error("FCM error:", fcmError);

      return res.status(500).json({
        error: `Failed to send FCM notification: ${fcmError.message || "Unknown error"}`,
      });
    }
  } catch (error) {
    console.error("Error sending FCM notification:", error);

    return res.status(500).json({ error: "Internal server error" });
  }
}