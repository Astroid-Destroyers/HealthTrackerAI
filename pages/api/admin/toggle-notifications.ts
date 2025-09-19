import type { NextApiRequest, NextApiResponse } from "next";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const ADMIN_EMAIL = "new.roeepalmon@gmail.com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        return res.status(500).json({ error: "Firebase Admin environment variables not configured" });
      }

      // Clean the private key
      const cleanPrivateKey = privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

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
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
      return res.status(500).json({ error: "Failed to initialize Firebase Admin SDK" });
    }
  } else {
    // Use existing app
    const app = getApps()[0];
    var db = getFirestore(app);
    var auth = getAuth(app);
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
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    const { userId, deviceId, enabled } = req.body;

    if (!userId || !deviceId || typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Missing required fields: userId, deviceId, enabled" });
    }

    // Update device notification status
    const deviceRef = db.collection("users").doc(userId).collection("devices").doc(deviceId);
    await deviceRef.update({
      notificationsEnabled: enabled,
      lastUpdated: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error toggling notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}