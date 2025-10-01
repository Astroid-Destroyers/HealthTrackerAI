import { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase Admin SDK
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

const db = getFirestore();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is called by Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get users who haven't logged health data in 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const usersSnapshot = await db.collection('users').get();
    const reminderEmails = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const lastActivity = userData.lastHealthUpdate?.toDate() || new Date(0);
      
      if (lastActivity < threeDaysAgo && userData.email) {
        reminderEmails.push({
          email: userData.email,
          name: userData.displayName || 'User',
          lastActivity: lastActivity
        });
      }
    }

    // Send reminder emails
    const emailPromises = reminderEmails.map(async (user) => {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">HealthTrackerAI</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">Hey ${user.name}! 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              We noticed you haven't logged your health data in a few days. 
              Consistent tracking helps us provide better insights for your health journey!
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://healthtrackerai.xyz" 
                 style="background: #667eea; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 8px; display: inline-block;">
                Log Your Health Data
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              Stay on track with your health goals! 💪
            </p>
          </div>
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2025 HealthTrackerAI. All rights reserved.</p>
            <p>
              <a href="https://healthtrackerai.xyz" style="color: #667eea;">Visit Website</a>
            </p>
          </div>
        </div>
      `;

      return resend.emails.send({
        from: "HealthTrackerAI <noreply@healthtrackerai.xyz>",
        to: user.email,
        subject: "Don't forget to track your health! 📊",
        html: htmlContent,
        text: `Hey ${user.name}! We noticed you haven't logged your health data in a few days. Visit https://healthtrackerai.xyz to continue tracking your health journey!`
      });
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Scheduled email job completed: ${successful} sent, ${failed} failed`);

    res.status(200).json({ 
      success: true, 
      sent: successful, 
      failed: failed,
      totalUsers: reminderEmails.length 
    });

  } catch (error) {
    console.error("Scheduled email error:", error);
    res.status(500).json({ 
      error: "Failed to send scheduled emails", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}