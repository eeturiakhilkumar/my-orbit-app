import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQmeji04Hbg4ZkOXIXiAbjzYRa3T6mqek",
  authDomain: "my-orbit-app-f2a73.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "my-orbit-app-f2a73",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "my-orbit-app-f2a73.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "942506770733",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:942506770733:web:499fa8f725cf0df22bd3a4",
  measurementId: "G-E52VJHJDFV"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const setupRecaptcha = (containerId: string) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response: any) => {
        console.log("reCAPTCHA solved");
      },
      'expired-callback': () => {
        console.log("reCAPTCHA expired");
      }
    });
  }
};

export { app, auth, googleProvider };
