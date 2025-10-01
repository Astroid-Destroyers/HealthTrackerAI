import { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const ADMIN_EMAIL = "new.roeepalmon@gmail.com";
const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { to, subject, html, text } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ 
        error: "Missing required fields: to, subject, and either html or text" 
      });
    }

    // Send email using Resend
    const emailData: any = {
      from: "HealthTrackerAI Admin <alerts@healthtrackerai.xyz>",
      to: Array.isArray(to) ? to : [to],
      subject: subject,
    };

    if (html) {
      emailData.html = html;
    }
    if (text) {
      emailData.text = text;
    }

    console.log("Sending email with Resend:", {
      to: emailData.to,
      subject: emailData.subject,
      hasHtml: !!html,
      hasText: !!text,
    });

    const result = await resend.emails.send(emailData);

    console.log("Resend API response:", result);

    if (result.error) {
      console.error("Resend error:", result.error);
      return res.status(500).json({ 
        error: "Failed to send email",
        details: result.error 
      });
    }

    res.status(200).json({ 
      success: true, 
      messageId: result.data?.id,
      message: "Email sent successfully" 
    });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ 
      error: "Failed to send email", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}