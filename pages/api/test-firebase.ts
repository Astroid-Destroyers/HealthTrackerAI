import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("Firebase Admin imported successfully");
    console.log("admin object:", typeof admin);
    console.log("admin.initializeApp:", typeof admin.initializeApp);
    console.log("admin.apps:", admin.apps);
    res.status(200).json({ message: "Firebase Admin import test successful" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}