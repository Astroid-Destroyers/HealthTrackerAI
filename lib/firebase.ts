// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  storageBucket: "healthtrackerai-e5819.firebasestorage.app",
  // add these if you use them elsewhere:
  // messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
  // appId: process.env.NEXT_PUBLIC_FB_APP_ID,
};

export const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// keep session across pages/tabs
setPersistence(auth, browserLocalPersistence);
