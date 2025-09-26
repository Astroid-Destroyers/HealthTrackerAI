import { NextApiRequest, NextApiResponse } from "next";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import twilio from "twilio";

const ADMIN_EMAIL = "new.roeepalmon@gmail.com";

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize Firebase Admin SDK
let auth: any = null;

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

    const { userId, phoneNumber, message } = req.body;

    if (!userId || !phoneNumber || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (message.length > 160) {
      return res
        .status(400)
        .json({ error: "Message too long (max 160 characters)" });
    }

    // Verify the user exists and the phone number matches
    const targetUserRecord = await auth.getUser(userId);

    if (targetUserRecord.phoneNumber !== phoneNumber) {
      return res.status(400).json({ error: "Phone number mismatch" });
    }

    // Send SMS using Twilio
    try {
      console.log(`Attempting to send SMS:`);
      console.log(`- From: ${process.env.TWILIO_PHONE_NUMBER}`);
      console.log(`- To: ${phoneNumber}`);
      console.log(`- Message: "${message}"`);

      const smsResponse = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      console.log(`SMS sent successfully!`);
      console.log(`- Message SID: ${smsResponse.sid}`);
      console.log(`- Status: ${smsResponse.status}`);
      console.log(`- To: ${smsResponse.to}`);
      console.log(`- From: ${smsResponse.from}`);

      return res.status(200).json({
        success: true,
        message: "SMS sent successfully!",
        messageSid: smsResponse.sid,
        status: smsResponse.status,
      });
    } catch (twilioError: any) {
      console.error("Twilio error:", twilioError);

      // Handle specific Twilio errors
      if (twilioError.code === 21211) {
        return res
          .status(400)
          .json({ error: "Invalid phone number format" });
      }

      if (twilioError.code === 21614) {
        return res.status(400).json({
          error:
            "Phone number not verified (required for trial accounts). Please verify this number in your Twilio console.",
        });
      }

      if (twilioError.code === 30007) {
        return res.status(400).json({
          error:
            "Message blocked by carrier spam filter. Try using more natural, complete sentences and avoid test messages like 'hello' or 'test'.",
        });
      }

      return res.status(500).json({
        error: `Failed to send SMS: ${twilioError.message || "Unknown error"}`,
      });
    }
  } catch (error) {
    console.error("Error sending SMS:", error);

    return res.status(500).json({ error: "Internal server error" });
  }
}