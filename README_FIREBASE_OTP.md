# Firebase Phone Authentication with OTP - Quick Start

## 🚀 Quick Installation

```bash
npm install firebase
```

## 📋 Files Created

This implementation includes 3 core service files and 2 example UI files:

1. **`src/firebase.ts`** - Firebase initialization and reCAPTCHA setup
2. **`src/services/sendOTP.ts`** - OTP sending logic
3. **`src/services/verifyOTP.ts`** - OTP verification logic
4. **`src/components/OTPLogin.tsx`** - Complete UI component
5. **`src/pages/login.tsx`** - Example integration page

---

## ⚙️ Environment Variables

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Get these values from:
**Firebase Console** > **Project Settings** > **General** > **Your apps** > **Web app**

---

## 🔥 Firebase Console Setup (3 Steps)

### Step 1: Enable Phone Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Phone** and toggle **Enable**
5. Click **Save**

### Step 2: Add Authorized Domains
1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Click **Add domain** and add:
   - `localhost`
   - `127.0.0.1`
   - Your Vercel domain (e.g., `my-app.vercel.app`)

### Step 3: (Optional) Add Test Phone Numbers
For testing without real SMS:
1. Go to **Authentication** > **Sign-in method** > **Phone**
2. Scroll to "Phone numbers for testing"
3. Add test number: `+919999999999` with OTP: `123456`

---

## 💻 Usage

### Basic Usage (Recommended)

```tsx
// src/pages/login.tsx
import OTPLogin from '../components/OTPLogin';
import React from 'react';

export default function LoginPage() {
  return <div>This is a placeholder login page. The main login is at `pages/Login.tsx`.</div>;
}
```

### Custom Integration

```tsx
import { sendOTP } from '../services/sendOTP';
import { verifyOTP } from '../services/verifyOTP';
import { setupRecaptcha } from '../firebase';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import React, { useState, useEffect } from 'react';

// Example of a custom component using the services
function MyCustomOTPComponent() {
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');

  useEffect(() => {
    // Initialize reCAPTCHA when the component mounts
    const verifier = setupRecaptcha('recaptcha-container');
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear(); // Clear reCAPTCHA on unmount
    };
  }, []);

  const handleSendOTP = async () => {
    if (!recaptchaVerifier) return; // Should not happen if useEffect works
    const result = await sendOTP(phoneNumber, recaptchaVerifier);
    if (result.success && result.confirmationResult) {
      setConfirmationResult(result.confirmationResult);
      console.log('OTP sent!');
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult || !recaptchaVerifier) return;
    const verifyResult = await verifyOTP(otp, confirmationResult, recaptchaVerifier);
    if (verifyResult.success) {
      console.log('User UID:', verifyResult.data.uid);
      console.log('ID Token:', verifyResult.data.idToken);
    }
  };

  return (
    <div>
      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91XXXXXXXXXX" />
      <button onClick={handleSendOTP}>Send OTP</button>

      {confirmationResult && (
        <>
          <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
          <button onClick={handleVerifyOTP}>Verify OTP</button>
        </>
      )}

      {/* Don't forget the reCAPTCHA container! */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
```

---

## 🎯 Features

- ✅ **+91 Phone Format Validation** - Auto-formats Indian phone numbers
- ✅ **Firebase reCAPTCHA** - Invisible reCAPTCHA verification
- ✅ **OTP via SMS** - Uses Firebase's phone authentication
- ✅ **Session Storage** - Automatically stores ID token in localStorage
- ✅ **Error Handling** - Comprehensive error messages for all scenarios
- ✅ **Loading States** - Shows loading indicators during API calls
- ✅ **Responsive UI** - Works on mobile and desktop
- ✅ **TypeScript** - Fully typed for safety
- ✅ **Vercel Compatible** - Works seamlessly on Vercel

---

## 📱 Phone Number Format

**Required Format:** `+91XXXXXXXXXX`

Examples:
- ✅ `+919876543210` (Correct)
- ❌ `9876543210` (Missing +91)
- ❌ `+91 98765 43210` (Contains spaces)
- ❌ `919876543210` (Missing +)

The UI automatically adds `+91` prefix for user convenience.

---

## 🔐 Session Management

```typescript
import { getStoredSession, clearSession } from '../services/verifyOTP';

// Get current session
const session = getStoredSession();
console.log(session.token);       // Firebase ID token
console.log(session.userId);      // User UID
console.log(session.phoneNumber); // User's phone

// Logout
clearSession();
```

---

## 🚢 Vercel Deployment

1. **Add Environment Variables in Vercel:**
   - Go to Project Settings > Environment Variables
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables

2. **Add Vercel Domain to Firebase:**
   - After deployment, copy your Vercel URL
   - Add it to Firebase Console > Authentication > Authorized domains

3. **Deploy:**
```bash
git push origin main
# or
vercel --prod
```

---

## 🐛 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Missing recaptcha-container div" | Add `<div id="recaptcha-container"></div>` to your component |
| "Phone number must start with +91" | Use format: `+91XXXXXXXXXX` |
| "reCAPTCHA verification failed" | Add your domain to Firebase authorized domains |
| "Invalid OTP" | Check the OTP sent to your phone |
| "OTP expired" | Request a new OTP (OTPs expire after ~5 minutes) |
| "SMS quota exceeded" | Upgrade to Firebase Blaze plan or wait 24 hours |

---

## 🧪 Testing

### Test on Localhost
```bash
npm run dev
```
Navigate to `http://localhost:3000/login`

### Test with Real Phone Number
1. Enter your phone: `+919876543210`
2. Click "Send OTP"
3. Check your phone for SMS
4. Enter the 6-digit OTP
5. Click "Verify OTP"

### Test with Firebase Test Number
1. Add test number in Firebase Console (+919999999999 → 123456)
2. Use this number in your app
3. Enter the predefined OTP (123456)
4. No SMS will be sent (free testing)

---

## 📊 API Response Format

### sendOTP Response
```typescript
{
  success: boolean;
  message: string;
  error?: string;
}
```

### verifyOTP Response
```typescript
{
  success: boolean;
  message: string;
  data?: {
    uid: string;
    phoneNumber: string;
    idToken: string;
    user: { ... };
  };
  error?: string;
}
```

---

## 🎨 Customization

### Change Colors/Styles
Edit the `styles` object in `src/components/OTPLogin.tsx`

### Use Your Own UI
```tsx
import { sendOTP } from '../services/sendOTP';
import { verifyOTP } from '../services/verifyOTP';

// Build your custom UI and call these functions
```

### Add Custom Logic After Login
```tsx
// In OTPLogin.tsx, modify handleVerifyOTP:
if (result.success && result.data) {
  // Your custom logic
  saveUserToDatabase(result.data);
  redirectToDashboard();
}
```

---

## 📦 What's Included

```
src/
├── firebase.ts                    # Firebase config & reCAPTCHA setup
├── services/
│   ├── sendOTP.ts                # Send OTP logic
│   └── verifyOTP.ts              # Verify OTP logic
├── components/
│   └── OTPLogin.tsx              # Complete UI with form
└── pages/
    └── login.tsx                 # Example integration

FIREBASE_SETUP_INSTRUCTIONS.md    # Detailed setup guide
README_FIREBASE_OTP.md            # This quick start guide
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - Add it to `.gitignore`
2. **Use environment variables** - Don't hardcode Firebase config
3. **Enable App Check** - For production apps (Firebase Console)
4. **Set up Security Rules** - If using Firestore/Storage
5. **Monitor usage** - Check Firebase Console for unusual activity
6. **Rate limiting** - Implement on your backend if needed

---

## 📞 Need Help?

1. Check the detailed guide: `FIREBASE_SETUP_INSTRUCTIONS.md`
2. Check browser console for error messages
3. Check Firebase Console > Authentication > Logs
4. Verify all environment variables are set
5. Ensure domain is in Firebase authorized domains

---

## ✅ Checklist

Before deploying to production:

- [ ] Install Firebase: `npm install firebase`
- [ ] Add Firebase config to `.env.local`
- [ ] Enable Phone Authentication in Firebase Console
- [ ] Add localhost to Firebase authorized domains
- [ ] Test with your phone number locally
- [ ] Add Vercel domain to Firebase authorized domains
- [ ] Add environment variables to Vercel
- [ ] Deploy and test on production
- [ ] Consider upgrading to Firebase Blaze plan for production

---

## 🎉 You're All Set!

Your Firebase Phone Authentication system is ready. Start by:

1. Running `npm install firebase`
2. Adding your Firebase config to `.env.local`
3. Testing on `http://localhost:3000/login`

Happy coding! 🚀
