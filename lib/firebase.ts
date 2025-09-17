// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  // add these if you use them elsewhere:
  // storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  // messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
  // appId: process.env.NEXT_PUBLIC_FB_APP_ID,
};

export const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// keep session across pages/tabs
setPersistence(auth, browserLocalPersistence);
