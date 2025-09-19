import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  try {
    // Send Discord webhook
    const discordWebhookUrl = "https://discord.com/api/webhooks/1418405770810232832/MfyyREbxnBYp8_0otGam7Uc5CHLz674MEEmjN8G2nlF4gPlEFgyRQqzhq6SPLP3Dhnw2";

    const discordEmbed = {
      title: "📬 New Contact Form Submission",
      description: `A new message has been received from the HealthTrackerAI contact form.`,
      color: 0x007bff, // Blue color
      fields: [
        {
          name: "👤 Name",
          value: name,
          inline: true
        },
        {
          name: "📧 Email",
          value: email,
          inline: true
        },
        {
          name: "📝 Subject",
          value: subject,
          inline: false
        },
        {
          name: "💬 Message",
          value: message.length > 1024 ? message.substring(0, 1021) + "..." : message,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "HealthTrackerAI Contact Form",
        icon_url: "https://health-tracker-ai-sigma.vercel.app/favicon.ico"
      }
    };

    const webhookPayload = {
      embeds: [discordEmbed],
      username: "HealthTrackerAI Bot",
      avatar_url: "https://health-tracker-ai-sigma.vercel.app/favicon.ico"
    };

    // Send webhook to Discord
    const webhookResponse = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      console.error("Discord webhook failed:", webhookResponse.status, webhookResponse.statusText);
      return res.status(500).json({ message: "Failed to send message. Please try again." });
    }

    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
}