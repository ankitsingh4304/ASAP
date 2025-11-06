// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * IMPORTANT:
 * Replace all values below with your Firebase project's config
 * (Firebase Console → Project settings → General → Your apps).
 */
const firebaseConfig = {
  apiKey: "AIzaSyAAkwSwm3Lpc-uONPd-yfUFkPVA3OmAxbk",
  authDomain: "innoneedhealthapp.firebaseapp.com",
  projectId: "innoneedhealthapp",
  storageBucket: "innoneedhealthapp.firebasestorage.app",
  messagingSenderId: "457650817511",
  appId: "1:457650817511:web:cd2403ff7f137f9bf3d542",
};

// Avoid re-initializing in Expo fast refresh
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ This must NOT be undefined

export default app;
