import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-expect-error - getReactNativePersistence is exported in React Native build of firebase/auth
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Replace these with your actual Firebase project config or use .env variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCICuNpwi_zMnaE6qTTDWrZ26x8w18pfnE",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "bizilink-a8d60.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "bizilink-a8d60",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "bizilink-a8d60.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "781913153882",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:781913153882:web:ea179c8514d9d17831d363"
};

export const PUBLIC_STORE_BASE_URL = process.env.EXPO_PUBLIC_STORE_BASE_URL || "https://bizi-link.vercel.app";

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
