import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Define global types for Window to avoid TS errors
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
    confirmationResult: any;
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Sets up the invisible reCAPTCHA verifier.
 * @param phone The phone number to verify (unused by RecaptchaVerifier directly but good for context)
 */
export const setupRecaptcha = (phone: string) => {
  const container = document.getElementById("recaptcha-container");
  if (!container) {
    throw new Error("Missing recaptcha-container div");
  }

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (error) {
      console.warn("Failed to clear existing recaptcha", error);
    }
    window.recaptchaVerifier = undefined;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    },
  });

  return window.recaptchaVerifier;
};