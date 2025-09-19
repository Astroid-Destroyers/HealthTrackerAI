import type { NextApiRequest, NextApiResponse } from "next";
import type { UserRecord } from "firebase-admin/auth";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const ADMIN_EMAIL = "new.roeepalmon@gmail.com";

// Initialize Firebase Admin SDK
let db: any = null;
let auth: any = null;

if (!getApps().length) {
  try {
    const projectId = process.env.FB_PROJECT_ID;
    const clientEmail = process.env.FB_CLIENT_EMAIL;
    const privateKey = process.env.FB_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error("Missing Firebase Admin environment variables");
    } else {
      // Clean the private key
      const cleanPrivateKey = privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: cleanPrivateKey,
        }),
        projectId: projectId,
      });

      db = getFirestore(app);
      auth = getAuth(app);
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!db) {
    return res.status(500).json({ error: "Firebase Admin SDK not properly configured" });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(idToken);

    // Check if user is admin
    if (decodedToken.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    // Get all users from Firebase Auth
    const listUsersResult = await auth.listUsers();
    console.log(`Found ${listUsersResult.users.length} users in Firebase Auth`);

    const users = await Promise.all(
      listUsersResult.users.map(async (userRecord: UserRecord) => {
        const userId = userRecord.uid;
        console.log(`Processing user: ${userId}, email: ${userRecord.email}`);

        // Get user's devices from Firestore
        const devicesSnapshot = await db.collection('users').doc(userId).collection('devices').get();
        console.log(`User ${userId} has ${devicesSnapshot.docs.length} devices`);

        const devices = devicesSnapshot.docs.map((deviceDoc: QueryDocumentSnapshot) => ({
          id: deviceDoc.id,
          ...deviceDoc.data(),
        }));

        return {
          uid: userId,
          email: userRecord.email,
          displayName: userRecord.displayName || null,
          devices: devices,
        };
      })
    );

    console.log(`Returning ${users.length} users to frontend`);

    res.status(200).json({
      users: users,
      debug: {
        totalUsersInAuth: listUsersResult.users.length,
        adminEmail: ADMIN_EMAIL,
        authenticatedUser: decodedToken.email
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}