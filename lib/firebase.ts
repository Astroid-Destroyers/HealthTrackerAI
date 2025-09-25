// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZWWDF_HlPC2I8OILJb2A_dCoe9X6bWiM",
  authDomain: "healthtrackerai-e5819.firebaseapp.com",
  projectId: "healthtrackerai-e5819",
  storageBucket: "healthtrackerai-e5819.firebasestorage.app",
  messagingSenderId: "1068877472768",
  appId: "1:1068877472768:web:a877e4b1c922e5a10c64e5",
  measurementId: "G-QGL0P7NDCC",
};

export const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only if supported (client-side)
export const getAnalyticsInstance = (): Analytics | null => {
  if (typeof window === "undefined") return null;
  try {
    return getAnalytics(app);
  } catch (error) {
    console.warn("Analytics not available:", error);

    return null;
  }
};

// Initialize messaging only if supported (client-side)
export const getMessagingInstance = async () => {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();

  return supported ? getMessaging(app) : null;
};

// keep session across pages/tabs
setPersistence(auth, browserLocalPersistence);
