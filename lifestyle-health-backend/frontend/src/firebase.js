import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnGGBB4r7aHd7i51hjgqTaoYRLqoqZZn0",
  authDomain: "healthsync-ai-2eb68.firebaseapp.com",
  projectId: "healthsync-ai-2eb68",
  storageBucket: "healthsync-ai-2eb68.firebasestorage.app",
  messagingSenderId: "25956005308",
  appId: "1:25956005308:web:4f9662944aeca961e9a7b9",
  measurementId: "G-WQ57L77Z1D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export messaging instance for use throughout the app
export const messaging = getMessaging(app);