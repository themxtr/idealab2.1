import { auth, setupRecaptcha } from "./firebase";
import { signInWithPhoneNumber } from "firebase/auth";

export const sendOTP = async (phone: string) => {
  try {
    if (!phone || !phone.startsWith("+91")) {
      throw new Error("Phone number must start with +91");
    }

    // 1. Setup Recaptcha
    const appVerifier = setupRecaptcha(phone);

    // 2. Send OTP
    const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);

    // 3. Store confirmation result globally for the verify step
    window.confirmationResult = confirmationResult;

    return "OTP Sent";
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};