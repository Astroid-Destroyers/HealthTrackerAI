import { NextApiRequest, NextApiResponse } from "next";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const ADMIN_EMAIL = "new.roeepalmon@gmail.com";

// Textla SMS configuration
const TEXTLA_API_KEY = process.env.TEXTLA_API_KEY;
const TEXTLA_API_URL = process.env.TEXTLA_API_URL || "https://api.textla.com/v1/sms";
const TEXTLA_SENDER_ID = process.env.TEXTLA_SENDER_ID || "HealthTracker";

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

    // Send SMS using Textla
    try {
      console.log(`Attempting to send SMS via Textla:`);
      console.log(`- From: ${TEXTLA_SENDER_ID}`);
      console.log(`- To: ${phoneNumber}`);
      console.log(`- Message: "${message}"`);

      if (!TEXTLA_API_KEY) {
        throw new Error("Textla API key not configured");
      }

      const textlaPayload = {
        to: phoneNumber,
        from: TEXTLA_SENDER_ID,
        text: message,
      };

      const response = await fetch(TEXTLA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEXTLA_API_KEY}`,
        },
        body: JSON.stringify(textlaPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Textla API error: ${responseData.message || 'Unknown error'}`);
      }

      console.log(`SMS sent successfully via Textla!`);
      console.log(`- Message ID: ${responseData.id || responseData.messageId}`);
      console.log(`- Status: ${responseData.status}`);

      return res.status(200).json({
        success: true,
        message: "SMS sent successfully via Textla!",
        messageId: responseData.id || responseData.messageId,
        status: responseData.status,
      });
    } catch (textlaError: any) {
      console.error("Textla error:", textlaError);

      // Handle Textla API errors
      let errorMessage = "Failed to send SMS";
      
      if (textlaError.message?.includes("Invalid phone number")) {
        errorMessage = "Invalid phone number format. Please use international format (+1234567890)";
      } else if (textlaError.message?.includes("Insufficient balance")) {
        errorMessage = "SMS service temporarily unavailable (insufficient balance)";
      } else if (textlaError.message?.includes("API key")) {
        errorMessage = "SMS service configuration error";
      } else {
        errorMessage = `Failed to send SMS: ${textlaError.message || "Unknown error"}`;
      }

      return res.status(500).json({
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error("Error sending SMS:", error);

    return res.status(500).json({ error: "Internal server error" });
  }
}