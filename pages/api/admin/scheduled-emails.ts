import { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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
const db = getFirestore();

interface ScheduledEmail {
  id?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
  createdBy: string;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // Schedule a new email
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

      const { to, subject, html, text, scheduledFor } = req.body;

      if (!to || !subject || !html || !scheduledFor) {
        return res.status(400).json({ 
          error: "Missing required fields: to, subject, html, scheduledFor" 
        });
      }

      const scheduledEmail: ScheduledEmail = {
        to,
        subject,
        html,
        text,
        scheduledFor: new Date(scheduledFor),
        status: 'pending',
        createdBy: decodedToken.email,
        createdAt: new Date()
      };

      const docRef = await db.collection('scheduledEmails').add(scheduledEmail);

      res.status(200).json({ 
        success: true, 
        emailId: docRef.id,
        message: "Email scheduled successfully" 
      });

    } catch (error) {
      console.error("Error scheduling email:", error);
      res.status(500).json({ 
        error: "Failed to schedule email", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  } 
  
  else if (req.method === "GET") {
    // Process pending emails (called by cron)
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const now = new Date();
      const pendingEmailsSnapshot = await db
        .collection('scheduledEmails')
        .where('status', '==', 'pending')
        .where('scheduledFor', '<=', now)
        .get();

      const results = [];

      for (const doc of pendingEmailsSnapshot.docs) {
        const emailData = doc.data() as ScheduledEmail;
        
        try {
          const result = await resend.emails.send({
            from: "HealthTrackerAI <noreply@healthtrackerai.xyz>",
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text
          });

          // Update status to sent
          await doc.ref.update({
            status: 'sent',
            sentAt: new Date(),
            messageId: result.data?.id
          });

          results.push({ id: doc.id, status: 'sent', messageId: result.data?.id });

        } catch (error) {
          // Update status to failed
          await doc.ref.update({
            status: 'failed',
            error: error instanceof Error ? error.message : "Unknown error"
          });

          results.push({ id: doc.id, status: 'failed', error: error instanceof Error ? error.message : "Unknown error" });
        }
      }

      res.status(200).json({ 
        success: true, 
        processed: results.length,
        results: results 
      });

    } catch (error) {
      console.error("Error processing scheduled emails:", error);
      res.status(500).json({ 
        error: "Failed to process scheduled emails", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }
  
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}