import { UserCredential, ConfirmationResult, RecaptchaVerifier, User } from "firebase/auth";

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data?: {
    uid: string;
    phoneNumber: string | null;
    idToken: string;
    user: User;
    // Consider returning the full User object or a more specific DTO
    // user: User; // If you want to return the full Firebase User object
  };
  error?: string;
}

export const verifyOTP = async (otp: string, confirmationResult: ConfirmationResult, recaptchaVerifier: RecaptchaVerifier): Promise<VerifyOTPResponse> => {
  try {
    // Validate OTP input
    if (!otp) {
      return {
        success: false,
        message: "OTP is required",
        error: "OTP_REQUIRED"
      };
    }

    // Validate OTP format (typically 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return {
        success: false,
        message: "OTP must be a 6-digit number",
        error: "INVALID_OTP_FORMAT"
      };
    }

    // Check if confirmationResult is provided
    if (!confirmationResult) {
      return {
        success: false,
        message: "No OTP request found. Please send OTP first.",
        error: "NO_CONFIRMATION_RESULT"
      };
    }

    // Verify OTP
    try {
      const result: UserCredential = await confirmationResult.confirm(otp);
      const user = result.user;

      // Get ID token
      const idToken = await user.getIdToken();

      console.log("OTP verified successfully for user:", user.uid);

      // Store session token if needed
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('firebaseAuthToken', idToken);
          localStorage.setItem('firebaseUserId', user.uid);
          if (user.phoneNumber) {
            localStorage.setItem('firebaseUserPhone', user.phoneNumber);
          }
        } catch (storageError) {
          console.warn("Failed to store session in localStorage:", storageError);
        }
      }

      // Clear recaptcha verifier after successful verification
      recaptchaVerifier.clear();
      return {
        success: true,
        message: "OTP verified successfully",
        data: {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          idToken: idToken, // Firebase ID token
          user: user, // Full Firebase User object
        }
      };
    } catch (error: any) {
      console.error("OTP verification failed:", error);

      // Clear recaptcha verifier on error
      recaptchaVerifier.clear();
      // Handle specific Firebase errors
      let errorMessage = "Failed to verify OTP. Please try again.";
      let errorCode = "VERIFY_OTP_FAILED";

      switch (error.code) {
        case "auth/invalid-verification-code":
          errorMessage = "Invalid OTP. Please check and try again.";
          errorCode = "INVALID_OTP";
          break;
        case "auth/code-expired":
          errorMessage = "OTP has expired. Please request a new one.";
          errorCode = "OTP_EXPIRED";
          break;
        case "auth/missing-verification-code":
          errorMessage = "OTP is required";
          errorCode = "MISSING_OTP";
          break;
        case "auth/session-expired":
          errorMessage = "Session expired. Please request a new OTP.";
          errorCode = "SESSION_EXPIRED";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later.";
          errorCode = "TOO_MANY_ATTEMPTS";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection.";
          errorCode = "NETWORK_ERROR";
          break;
        default:
          errorMessage = error.message || "Failed to verify OTP";
      }

      return {
        success: false,
        message: errorMessage,
        error: errorCode
      };
    }
  } catch (error: any) {
    console.error("Unexpected error in verifyOTP:", error);
    return {
      success: false,
      message: "An unexpected error occurred: " + error.message,
      error: "UNEXPECTED_ERROR"
    };
  }
};

// Helper function to clear stored session
export const clearSession = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('firebaseAuthToken');
      localStorage.removeItem('firebaseUserId');
      localStorage.removeItem('firebaseUserPhone');
    } catch (error) {
      console.warn("Failed to clear session from localStorage:", error);
    }
  }
};

// Helper function to get stored session
export const getStoredSession = (): {
  token: string | null;
  userId: string | null;
  phoneNumber: string | null;
} => {
  if (typeof window !== 'undefined') {
    try {
      return {
        token: localStorage.getItem('firebaseAuthToken'),
        userId: localStorage.getItem('firebaseUserId'),
        phoneNumber: localStorage.getItem('firebaseUserPhone'),
      };
    } catch (error) {
      console.warn("Failed to get session from localStorage:", error);
    }
  }
  return {
    token: null,
    userId: null,
    phoneNumber: null,
  };
};
