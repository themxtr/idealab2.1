import { signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";

export const sendOTP = async (
  phone: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<{ success: boolean; message: string; error?: string; confirmationResult?: ConfirmationResult }> => {
  try {
    // Validate phone number format
    if (!phone) {
      return {
        success: false,
        message: "Phone number is required",
        error: "PHONE_REQUIRED"
      };
    }

    // Check if phone starts with +91
    if (!phone.startsWith("+91")) {
      return {
        success: false,
        message: "Phone number must start with +91",
        error: "INVALID_PHONE_FORMAT"
      };
    }

    // Validate phone number length (+91 + 10 digits = 13 characters)
    if (phone.length !== 13) {
      return {
        success: false,
        message: "Phone number must be in format +91XXXXXXXXXX (10 digits after +91)",
        error: "INVALID_PHONE_LENGTH"
      };
    }

    // Validate that the remaining characters are digits
    const phoneDigits = phone.substring(3);
    if (!/^\d{10}$/.test(phoneDigits)) {
      return {
        success: false,
        message: "Phone number must contain only digits after +91",
        error: "INVALID_PHONE_DIGITS"
      };
    }

    // Check if recaptchaVerifier is provided
    if (!recaptchaVerifier) {
      return {
        success: false,
        message: "reCAPTCHA verifier not initialized. Please try again.",
        error: "RECAPTCHA_NOT_INITIALIZED"
      };
    }
    
    // Send OTP
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifier
      );

      console.log("OTP sent successfully to", phone);
      
      return {
        success: true,
        message: "OTP sent successfully to " + phone,
        confirmationResult: confirmationResult
      };
    } catch (error: any) {
      console.error("signInWithPhoneNumber failed:", error);
      
      // Clear recaptcha verifier on error
      recaptchaVerifier.clear();

      // Handle specific Firebase errors
      let errorMessage = "Failed to send OTP. Please try again.";
      let errorCode = "SEND_OTP_FAILED";

      switch (error.code) {
        case "auth/invalid-phone-number":
          errorMessage = "Invalid phone number format";
          errorCode = "INVALID_PHONE_NUMBER";
          break;
        case "auth/missing-phone-number":
          errorMessage = "Phone number is required";
          errorCode = "MISSING_PHONE_NUMBER";
          break;
        case "auth/quota-exceeded":
          errorMessage = "SMS quota exceeded. Please try again later.";
          errorCode = "QUOTA_EXCEEDED";
          break;
        case "auth/user-disabled":
          errorMessage = "This user account has been disabled";
          errorCode = "USER_DISABLED";
          break;
        case "auth/captcha-check-failed":
          errorMessage = "reCAPTCHA verification failed. Please try again.";
          errorCode = "CAPTCHA_FAILED";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later.";
          errorCode = "TOO_MANY_REQUESTS";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection.";
          errorCode = "NETWORK_ERROR";
          break;
        default:
          errorMessage = error.message || "Failed to send OTP";
      }

      return {
        success: false,
        message: errorMessage,
        error: errorCode
      };
    }
  } catch (error: any) {
    console.error("Unexpected error in sendOTP:", error);
    return {
      success: false,
      message: "An unexpected error occurred: " + error.message,
      error: "UNEXPECTED_ERROR"
    };
  }
};
