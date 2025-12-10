import React, { useState, useEffect } from "react";
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { sendOTP } from "../services/sendOTP";
import { verifyOTP, clearSession } from "../services/verifyOTP";
// import { fetchUserProfile, UserProfile } from "../services/userProfile"; // Conceptual: Uncomment if you implement userProfile.ts
import { setupRecaptcha } from "../firebase";

const OTPLogin: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>(""); // General error message
  const [successMessage, setSuccessMessage] = useState<string>(""); // For OTP sent/verified
  const [userInfo, setUserInfo] = useState<any>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Effect to initialize and clean up reCAPTCHA verifier
  useEffect(() => {
    // No need to initialize here, it will be done in handleSendOTP
    return () => {
      recaptchaVerifier?.clear(); // Clear reCAPTCHA on component unmount
    };
  }, [recaptchaVerifier]);

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear success messages after 5 seconds
  useEffect(() => {
    if (successMessage && step !== "success") {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, step]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Auto-add +91 prefix if not present
    if (value && !value.startsWith("+91")) {
      value = "+91" + value.replace(/^\+?91?/, "");
    }
    
    // Limit to 13 characters (+91 + 10 digits)
    if (value.length <= 13) {
      setPhoneNumber(value);
    }
    setError("");
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
    setError("");
  };

  const handleSendOTP = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);

    // Ensure reCAPTCHA is set up before sending OTP
    if (!recaptchaVerifier) {
      try {
        const verifier = setupRecaptcha("recaptcha-container");
        setRecaptchaVerifier(verifier);
      } catch (err: any) {
        setError(err.message || "Failed to setup reCAPTCHA.");
        setLoading(false);
        return;
      }
    }

    try {
      const result = await sendOTP(phoneNumber, recaptchaVerifier!); // recaptchaVerifier is guaranteed to be set here

      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult);
        setSuccessMessage(result.message);
        setStep("otp");
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!confirmationResult || !recaptchaVerifier) {
      setError("OTP request not initiated or reCAPTCHA not set up.");
      setLoading(false);
      return;
    }

    try {
      const result = await verifyOTP(otp, confirmationResult, recaptchaVerifier);

      if (result.success && result.data) { // Assuming result.data is always present on success
        let fullUserInfo = result.data;

        // Conceptual: Fetch additional user details from a database
        // if (fullUserInfo.uid) {
        //   const additionalProfile = await fetchUserProfile(fullUserInfo.uid);
        //   if (additionalProfile) {
        //     fullUserInfo = { ...fullUserInfo, ...additionalProfile };
        //   }
        // }

        setSuccessMessage("Login Successful!"); // Simpler success message for final step
        setUserInfo(fullUserInfo);
        setStep("success");
        console.log("User logged in successfully!");
        console.log("User UID:", result.data.uid);
        console.log("Phone Number:", result.data.phoneNumber);
        console.log("ID Token:", result.data.idToken);
        // console.log("Full User Info:", fullUserInfo); // Log the potentially enriched info
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    recaptchaVerifier?.clear(); // Clear reCAPTCHA if user wants to change phone
    setRecaptchaVerifier(null);
    setOtp("");
    setError("");
    setSuccessMessage("");
    setStep("phone");
  };

  const handleLogout = () => {
    recaptchaVerifier?.clear(); // Clear reCAPTCHA on logout
    setRecaptchaVerifier(null);
    clearSession();
    setPhoneNumber("");
    setOtp("");
    setUserInfo(null);
    setStep("phone");
    setError("");
    setSuccessMessage("");
  };

  const formatPhoneDisplay = (phone: string) => {
    if (phone.startsWith("+91")) {
      return `+91 ${phone.substring(3, 8)} ${phone.substring(8)}`;
    }
    return phone;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Phone Authentication</h2>
        
        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && step !== "success" && (
          <div style={styles.successBox}>
            <span style={styles.successIcon}>✓</span>
            {successMessage}
          </div>
        )}

        {/* Phone Number Step */}
        {step === "phone" && (
          <div style={styles.stepContainer}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="+91XXXXXXXXXX"
              style={styles.input}
              disabled={loading}
            />
            <p style={styles.hint}>
              Enter your phone number with +91 country code
            </p>
            <button
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.length !== 13}
              style={{
                ...styles.button,
                ...(loading || phoneNumber.length !== 13 ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* OTP Verification Step */}
        {step === "otp" && (
          <div style={styles.stepContainer}>
            <div style={styles.phoneDisplay}>
              Verification code sent to{" "}
              <strong>{formatPhoneDisplay(phoneNumber)}</strong>
            </div>
            <label style={styles.label}>Enter OTP</label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              style={styles.otpInput}
              disabled={loading}
              maxLength={6}
            />
            <p style={styles.hint}>Enter the 6-digit code sent to your phone</p>
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              style={{
                ...styles.button,
                ...(loading || otp.length !== 6 ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={handleResendOTP}
              disabled={loading}
              style={styles.linkButton}
            >
              Change Phone Number
            </button>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && userInfo && (
          <div style={styles.stepContainer}>
            <div style={styles.successContainer}>
              <div style={styles.successIconLarge}>✓</div>
              <h3 style={styles.successTitle}>Login Successful!</h3>
              <div style={styles.userInfo}>
                <div style={styles.userInfoRow}>
                  <span style={styles.userInfoLabel}>User ID:</span>
                  <span style={styles.userInfoValue}>{userInfo.uid}</span>
                </div>
                <div style={styles.userInfoRow}>
                  <span style={styles.userInfoLabel}>Phone:</span>
                  <span style={styles.userInfoValue}>
                    {formatPhoneDisplay(userInfo.phoneNumber || "")}
                  </span>
                </div>
                {/* Conceptual: Display additional details if fetched */}
                {userInfo.fullName && (
                  <div style={styles.userInfoRow}>
                    <span style={styles.userInfoLabel}>Full Name:</span>
                    <span style={styles.userInfoValue}>{userInfo.fullName}</span>
                  </div>
                )}
                {userInfo.universityId && (
                  <div style={styles.userInfoRow}>
                    <span style={styles.userInfoLabel}>University ID:</span>
                    <span style={styles.userInfoValue}>{userInfo.universityId}</span>
                  </div>
                )}
                </div>
              </div>
              <button onClick={handleLogout} style={styles.button}>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* reCAPTCHA Container - Required for Firebase */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

// Inline styles for the component
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "30px",
    textAlign: "center",
    color: "#333",
  },
  stepContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#555",
    marginBottom: "5px",
  },
  input: {
    padding: "12px 16px",
    fontSize: "16px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.3s",
  },
  otpInput: {
    padding: "12px 16px",
    fontSize: "24px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
    textAlign: "center",
    letterSpacing: "8px",
    fontWeight: "600",
  },
  hint: {
    fontSize: "12px",
    color: "#888",
    margin: "0",
  },
  button: {
    padding: "14px 20px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    marginTop: "10px",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
    cursor: "not-allowed",
  },
  linkButton: {
    padding: "10px",
    fontSize: "14px",
    color: "#007bff",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
  },
  errorBox: {
    padding: "12px 16px",
    backgroundColor: "#fee",
    border: "1px solid #fcc",
    borderRadius: "8px",
    color: "#c33",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  errorIcon: {
    fontSize: "18px",
  },
  successBox: {
    padding: "12px 16px",
    backgroundColor: "#efe",
    border: "1px solid #cfc",
    borderRadius: "8px",
    color: "#3c3",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  successIcon: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  phoneDisplay: {
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#555",
    textAlign: "center",
    marginBottom: "10px",
  },
  successContainer: {
    textAlign: "center",
  },
  successIconLarge: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#4caf50",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "bold",
    margin: "0 auto 20px",
  },
  successTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "20px",
  },
  userInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    textAlign: "left",
  },
  userInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #e0e0e0",
  },
  userInfoLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#666",
  },
  userInfoValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    wordBreak: "break-all",
  },
};

export default OTPLogin;
