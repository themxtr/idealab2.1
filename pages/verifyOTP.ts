import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const verifyOTP = async (otp: string) => {
  try {
    // 1. Validate confirmationResult exists
    if (!window.confirmationResult) {
      throw new Error("No OTP request found. Please send OTP first.");
    }

    // 2. Confirm OTP
    const result = await window.confirmationResult.confirm(otp);
    const user = result.user;

    // 2.5. Create User Profile in Firestore if it doesn't exist
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        createdAt: serverTimestamp(),
      });
    }

    // 3. Get ID Token
    const idToken = await user.getIdToken();

    return {
      uid: user.uid,
      phoneNumber: user.phoneNumber,
      idToken,
      user, // Return full user object if needed
    };
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};