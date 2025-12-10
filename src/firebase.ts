// firebase.ts — Fully fixed for Vite + React + TS + Phone Auth

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, RecaptchaVerifier } from "firebase/auth";

// -------------------------------------------------------------
// IMPORTANT: Vite uses import.meta.env, NOT process.env
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Optional debug check
if (import.meta.env.DEV) { // Only log in development mode
  console.log("Loaded Firebase API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);
}

// -------------------------------------------------------------
// Initialize Firebase safely
// -------------------------------------------------------------
let app: FirebaseApp;
let authInstance: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
} else {
  app = getApps()[0];
  authInstance = getAuth(app);
}

export const auth = authInstance;

// -------------------------------------------------------------
// reCAPTCHA Setup (Invisible Mode) — Required for OTP
// -------------------------------------------------------------
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  // Check if the container element exists
  if (!document.getElementById(containerId)) {
    throw new Error(
      `Missing <div id="${containerId}"></div>. Add this div in your component before calling setupRecaptcha().`
    );
  }

  // Create the verifier
  const verifier = new RecaptchaVerifier(
    auth, // Firebase Auth instance is the first argument
    containerId,
    {
      size: "invisible",
      callback: () => {
        console.log("reCAPTCHA verified.");
      },
      "expired-callback": () => {
        console.warn("reCAPTCHA expired. Resetting...");
        verifier.clear();
      },
    }
  );

  // Ensure renderer is created
  verifier.render().catch((err) => {
    console.error("Error rendering reCAPTCHA:", err);
  });

  return verifier;
};
