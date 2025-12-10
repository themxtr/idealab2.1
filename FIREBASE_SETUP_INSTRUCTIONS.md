# Firebase Phone Authentication Setup Instructions

## Complete Implementation Guide

This guide will help you set up Firebase Phone Authentication with OTP in your Next.js/React application.

---

## 📦 Installation

### 1. Install Firebase SDK

```bash
npm install firebase
```

---

## 🔥 Firebase Console Setup

### 1. Create/Access Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Click on "Project Settings" (gear icon)

### 2. Get Firebase Configuration

1. In Project Settings, scroll down to "Your apps"
2. Click on the web icon `</>` to add a web app
3. Register your app with a nickname
4. Copy the `firebaseConfig` object values
5. Add these to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 3. Enable Phone Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Phone** provider
3. Click **Enable** toggle
4. Click **Save**

### 4. Add Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add the following domains:
   - `localhost` (for local development)
   - `127.0.0.1` (for local development)
   - Your Vercel deployment domain (e.g., `your-app.vercel.app`)
   - Any custom domains you use

**How to add:**
- Click "Add domain"
- Enter the domain (without https://)
- Click "Add"

---

## 📁 File Structure

Your project should have the following files:

```
src/
├── firebase.ts                 # Firebase initialization & reCAPTCHA setup
├── services/
│   ├── sendOTP.ts             # OTP sending logic
│   └── verifyOTP.ts           # OTP verification logic
├── components/
│   └── OTPLogin.tsx           # React UI component
└── pages/
    └── login.tsx              # Example page using OTPLogin
```

---

## 🚀 Usage

### Basic Integration

```tsx
// In your page or component
import OTPLogin from '../components/OTPLogin';

const MyPage = () => {
  return (
    <div>
      <OTPLogin />
    </div>
  );
};

export default MyPage;
```

### Advanced Integration with Callbacks

If you want to handle the login success in your parent component:

```tsx
import React from 'react';
import { sendOTP } from '../services/sendOTP';
import { verifyOTP } from '../services/verifyOTP';

import { setupRecaptcha } from '../firebase'; // Import setupRecaptcha
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'; // Import types

const CustomLoginPage = () => {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = React.useState<RecaptchaVerifier | null>(null);

  React.useEffect(() => {
    // Cleanup reCAPTCHA on component unmount
    return () => {
      recaptchaVerifier?.clear();
    };
  }, [recaptchaVerifier]);

  const handleSendOTP = async () => {
    setError(null);
    setLoading(true);

    // Initialize reCAPTCHA if not already done
    if (!recaptchaVerifier) {
      try {
        const verifier = setupRecaptcha('recaptcha-container');
        setRecaptchaVerifier(verifier);
      } catch (err: any) {
        setError(err.message || "Failed to setup reCAPTCHA.");
        setLoading(false);
        return;
      }
    }

    try {
      const result = await sendOTP(phoneNumber, recaptchaVerifier!);
      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult);
        console.log('OTP sent!');
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
    setError(null);
    setLoading(true);

    if (!confirmationResult || !recaptchaVerifier) {
      setError("OTP request not initiated or reCAPTCHA not set up.");
      setLoading(false);
      return;
    }

    try {
      const verifyResult = await verifyOTP(otp, confirmationResult, recaptchaVerifier);
      if (verifyResult.success) {
        console.log('User logged in:', verifyResult.data);
        window.location.href = '/dashboard';
      } else {
        setError(verifyResult.message);
      }
    } catch (err: any) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Custom Login Page</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!confirmationResult ? (
        <>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            disabled={loading}
          />
          <button onClick={handleSendOTP} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <p>OTP sent to {phoneNumber}.</p>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            disabled={loading}
          />
          <button onClick={handleVerifyOTP} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </>
      )}
      
      {/* This div is crucial for Firebase's reCAPTCHA to render. */}
      {/* It can be hidden with CSS if you don't want it visible. */}
      <div id="recaptcha-container" style={{ marginTop: '20px' }}></div>
    </div>
  );
};
```

---

## 🔐 Session Management

The system automatically stores the session token in localStorage:

```typescript
// Get stored session
import { getStoredSession } from '../services/verifyOTP';

const session = getStoredSession();
console.log(session.token);      // Firebase ID token
console.log(session.userId);     // User UID
console.log(session.phoneNumber); // User phone number

// Clear session (logout)
import { clearSession } from '../services/verifyOTP';
clearSession();
```

---

## 🛡️ Error Handling

The system handles all common errors:

### Send OTP Errors:
- `PHONE_REQUIRED` - Phone number is missing
- `INVALID_PHONE_FORMAT` - Phone doesn't start with +91
- `INVALID_PHONE_LENGTH` - Phone is not 13 characters
- `INVALID_PHONE_DIGITS` - Phone contains non-numeric characters
- `RECAPTCHA_SETUP_FAILED` - reCAPTCHA initialization failed
- `RECAPTCHA_NOT_INITIALIZED` - reCAPTCHA verifier not ready
- `INVALID_PHONE_NUMBER` - Firebase rejected the phone number
- `QUOTA_EXCEEDED` - SMS quota exceeded
- `TOO_MANY_REQUESTS` - Rate limit exceeded
- `NETWORK_ERROR` - Network connection issue

### Verify OTP Errors:
- `OTP_REQUIRED` - OTP is missing
- `INVALID_OTP_FORMAT` - OTP is not 6 digits
- `NO_CONFIRMATION_RESULT` - No OTP request found
- `INVALID_OTP` - Wrong OTP entered
- `OTP_EXPIRED` - OTP has expired
- `SESSION_EXPIRED` - Session expired
- `TOO_MANY_ATTEMPTS` - Too many verification attempts

---

## 🌐 Vercel Deployment

### 1. Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** > **Environment Variables**
3. Add all Firebase config variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 2. Add Vercel Domain to Firebase

After deploying to Vercel:
1. Copy your Vercel domain (e.g., `your-app.vercel.app`)
2. Go to Firebase Console > Authentication > Settings > Authorized domains
3. Add your Vercel domain

### 3. Deploy

```bash
git push origin main
# Or deploy manually
vercel --prod
```

---

## 🧪 Testing

### Localhost Testing

1. Start your development server:
```bash
npm run dev
```

2. Open `http://localhost:3000/login`
3. Enter a phone number in format: `+91XXXXXXXXXX`
4. Click "Send OTP"
5. Check your phone for the OTP
6. Enter the OTP and click "Verify OTP"

### Test Phone Numbers (Firebase Test Mode)

For development, you can add test phone numbers in Firebase Console:

1. Go to **Authentication** > **Sign-in method** > **Phone**
2. Scroll to "Phone numbers for testing"
3. Add test numbers with custom OTPs:
   - Phone: `+919999999999`
   - OTP: `123456`

These won't send actual SMS and will accept the predefined OTP.

---

## 📱 Phone Number Format

The system enforces Indian phone number format:

- **Required format:** `+91XXXXXXXXXX`
- **Length:** 13 characters (+91 + 10 digits)
- **Example:** `+919876543210`

The UI automatically adds the `+91` prefix when users start typing.

---

## 🎨 Customization

### Styling

The `OTPLogin.tsx` component uses inline styles. You can:

1. **Use CSS Modules:**
```tsx
import styles from './OTPLogin.module.css';
<div className={styles.container}>
```

2. **Use Tailwind CSS:**
```tsx
<div className="flex justify-center items-center min-h-screen">
```

3. **Use styled-components:**
```tsx
import styled from 'styled-components';
const Container = styled.div`...`;
```

### Custom UI

You can build your own UI and just use the services:

```tsx
import { sendOTP } from '../services/sendOTP';
import { verifyOTP } from '../services/verifyOTP';

// Your custom component logic here
// Just call sendOTP() and verifyOTP() with your own UI
```

---

## 🔍 Debugging

### Check Browser Console

Open browser DevTools (F12) and check the Console tab for:
- "OTP sent successfully to +91XXXXXXXXXX"
- "OTP verified successfully for user: USER_UID"
- Any error messages

### Common Issues

**1. "Missing recaptcha-container div"**
- Solution: Ensure `<div id="recaptcha-container"></div>` is in your component

**2. "reCAPTCHA verification failed"**
- Solution: Check if your domain is added to Firebase authorized domains

**3. "SMS quota exceeded"**
- Solution: Firebase has SMS limits. Check your Firebase Console for quota

**4. "Network error"**
- Solution: Check internet connection and Firebase configuration

**5. "Invalid phone number format"**
- Solution: Ensure phone is exactly `+91XXXXXXXXXX` (13 characters)

---

## 🔄 Production Checklist

Before going to production:

- [ ] Add production domain to Firebase Authorized domains
- [ ] Set up environment variables in Vercel
- [ ] Test with real phone numbers
- [ ] Set up Firebase billing (free tier has SMS limits)
- [ ] Implement rate limiting if needed
- [ ] Add user data to Firestore (optional)
- [ ] Set up Firebase Security Rules
- [ ] Enable Firebase App Check for additional security
- [ ] Monitor Firebase Authentication usage in Console

---

## 📊 Firebase Limits

### Free Tier (Spark Plan)
- **Phone Authentication:** Limited SMS per day
- **Storage:** 1 GB
- **Bandwidth:** 10 GB/month

### Paid Tier (Blaze Plan)
- **Phone Authentication:** Pay per SMS (varies by country)
- **India SMS Cost:** ~$0.01 per SMS
- Unlimited storage and bandwidth (pay as you go)

Check current pricing: [Firebase Pricing](https://firebase.google.com/pricing)

---

## 🛠️ Additional Features

### 1. Store User in Firestore

```typescript
// In verifyOTP.ts, after successful verification:
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const db = getFirestore();
await setDoc(doc(db, 'users', user.uid), {
  phoneNumber: user.phoneNumber,
  createdAt: new Date(),
  lastLogin: new Date(),
});
```

### 2. Protected Routes

```tsx
// middleware.ts or in your component
import { getStoredSession } from '../services/verifyOTP';

const ProtectedRoute = ({ children }) => {
  const session = getStoredSession();
  
  if (!session.token) {
    // Redirect to login
    window.location.href = '/login';
    return null;
  }
  
  return children;
};
```

### 3. Auto-redirect After Login

```tsx
// In OTPLogin.tsx, after successful verification:
const handleVerifyOTP = async () => {
  const result = await verifyOTP(otp);
  if (result.success) {
    // Redirect to dashboard
    window.location.href = '/dashboard';
  }
};
```

---

## 📞 Support

If you encounter issues:

1. Check Firebase Console for errors
2. Check browser console for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure your domain is in Firebase authorized domains
5. Check Firebase Authentication logs in Console

---

## ✅ Summary

You now have a complete Firebase Phone Authentication system with:

- ✅ Phone number validation (+91 format)
- ✅ Firebase reCAPTCHA integration
- ✅ OTP sending via SMS
- ✅ OTP verification
- ✅ User session management
- ✅ Error handling for all scenarios
- ✅ Works on localhost and Vercel
- ✅ Beautiful, responsive UI
- ✅ TypeScript support

Start by running:
```bash
npm install firebase
```

Then add your Firebase config to `.env.local` and you're ready to go!
