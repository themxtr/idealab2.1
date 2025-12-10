# Firebase Phone Authentication - Integration Guide

## 📋 Table of Contents
1. [Installation](#installation)
2. [Firebase Console Setup](#firebase-console-setup)
3. [Environment Variables](#environment-variables)
4. [Integration Examples](#integration-examples)
5. [Deployment Setup](#deployment-setup)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Installation

### Required NPM Package
```bash
npm install firebase
```

### For TypeScript Projects
If you're using TypeScript, ensure you have the following in your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "module": "esnext",
    "target": "es5",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

---

## 🔥 Firebase Console Setup

### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name and follow the setup wizard
4. Enable Google Analytics (optional)

### Step 2: Add Web App
1. In your Firebase project, click the Web icon (`</>`)
2. Register your app with a nickname
3. Copy the `firebaseConfig` object - you'll need this for `.env` file

### Step 3: Enable Phone Authentication
1. Go to **Authentication** → **Sign-in method**
2. Click on **Phone**
3. Click **Enable** toggle
4. Save

### Step 4: Add Authorized Domains
1. In Authentication → **Settings** → **Authorized domains**
2. Add the following domains:
   - `localhost` (for local development)
   - `127.0.0.1` (for local development)
   - Your Vercel domain (e.g., `your-app.vercel.app`)
   - Your custom domain if you have one

**Important:** Firebase automatically approves `localhost` and `127.0.0.1`, but you must manually add your production domains.

### Step 5: Configure App Verification (Important for Production)
1. Go to **Authentication** → **Settings** → **Phone numbers for testing** (optional)
2. For testing purposes, you can add test phone numbers with predefined OTPs
3. For production, ensure you have billing enabled on Firebase (required for SMS)

---

## 🔐 Environment Variables

### Create `.env.local` file in your project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### For Create React App (CRA):
Use `.env` file with `REACT_APP_` prefix:
```env
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

Then update `src/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
```

### For Vite:
Use `.env` file with `VITE_` prefix and update accordingly.

**Note:** Never commit `.env` files to version control. Add `.env.local` to your `.gitignore`.

---

## 📱 Integration Examples

### Example 1: Next.js Page (App Router)
```typescript
// app/login/page.tsx
import OTPLogin from "@/components/OTPLogin";

export default function LoginPage() {
  return (
    <main>
      <OTPLogin />
    </main>
  );
}
```

### Example 2: Next.js Page (Pages Router)
```typescript
// pages/login.tsx
import OTPLogin from "../components/OTPLogin";

export default function LoginPage() {
  return (
    <div>
      <OTPLogin />
    </div>
  );
}
```

### Example 3: Create React App
```typescript
// src/App.tsx
import React from "react";
import OTPLogin from "./components/OTPLogin";

function App() {
  return (
    <div className="App">
      <OTPLogin />
    </div>
  );
}

export default App;
```

### Example 4: With Protected Route
```typescript
// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredSession } from "../services/verifyOTP";
import { auth } from "../firebase";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const session = getStoredSession();
      
      if (session.token && session.userId) {
        // Verify token is still valid
        const user = auth.currentUser;
        if (user) {
          setAuthenticated(true);
        } else {
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return authenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
```

### Example 5: With Custom Success Callback
```typescript
// src/components/CustomOTPLogin.tsx
import React, { useState } from "react";
import { sendOTP } from "../services/sendOTP";
import { verifyOTP } from "../services/verifyOTP";
import { useNavigate } from "react-router-dom";

const CustomOTPLogin: React.FC = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const handleSendOTP = async () => {
    const result = await sendOTP(phoneNumber);
    if (result.success) {
      setStep("otp");
    }
  };

  const handleVerifyOTP = async () => {
    const result = await verifyOTP(otp);
    if (result.success) {
      // Custom success handling
      console.log("User logged in:", result.data);
      
      // Redirect to dashboard
      navigate("/dashboard");
    }
  };

  return (
    <div>
      {step === "phone" ? (
        <div>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91XXXXXXXXXX"
          />
          <button onClick={handleSendOTP}>Send OTP</button>
        </div>
      ) : (
        <div>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button onClick={handleVerifyOTP}>Verify</button>
        </div>
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default CustomOTPLogin;
```

---

## 🚢 Deployment Setup

### Vercel Deployment

#### Step 1: Add Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all your Firebase environment variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Step 2: Add Vercel Domain to Firebase
1. After deploying, copy your Vercel URL (e.g., `your-app.vercel.app`)
2. Go to Firebase Console → **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain** and paste your Vercel URL
4. If you have a custom domain, add that too

#### Step 3: Deploy
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Other Platforms (Netlify, AWS, etc.)

The same principles apply:
1. Add environment variables in your hosting platform's settings
2. Add your deployment domain to Firebase's authorized domains
3. Ensure your build process includes the environment variables

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. "Missing recaptcha-container div"
**Solution:** Ensure `<div id="recaptcha-container"></div>` is present in your component.

#### 2. "auth/unauthorized-domain"
**Solution:** Add your domain to Firebase Console → Authentication → Settings → Authorized domains

#### 3. "auth/quota-exceeded"
**Solution:** 
- Check Firebase Console → Usage and billing
- Upgrade to Blaze plan for production use
- Firebase free tier has limited SMS quota

#### 4. reCAPTCHA not showing/working
**Solution:**
- Clear browser cache
- Ensure your domain is authorized in Firebase
- Check if you have ad blockers that might block reCAPTCHA
- Verify Firebase config is correct

#### 5. "auth/code-expired"
**Solution:** OTP codes expire after 60 seconds. Request a new OTP.

#### 6. Environment variables not working
**Solution:**
- Restart development server after adding `.env` file
- For Next.js, ensure variables start with `NEXT_PUBLIC_`
- For CRA, ensure variables start with `REACT_APP_`
- Check that `.env.local` is in the project root

#### 7. Works on localhost but not on Vercel
**Solution:**
- Verify environment variables are set in Vercel dashboard
- Add Vercel domain to Firebase authorized domains
- Check browser console for specific errors
- Ensure Firebase billing is enabled for production

#### 8. "signInWithPhoneNumber failed"
**Solution:**
- Verify phone number format is correct: `+91XXXXXXXXXX`
- Check Firebase project has Phone authentication enabled
- Ensure you have sufficient SMS quota
- Check network connectivity

---

## 📞 Testing Phone Numbers (Optional)

For development/testing without using real phone numbers:

1. Go to Firebase Console → **Authentication** → **Settings**
2. Scroll to **Phone numbers for testing**
3. Add test phone numbers with verification codes:
   - Phone: `+911234567890`
   - Code: `123456`

When you use these test numbers, Firebase will skip sending actual SMS and accept the predefined code.

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use Firebase Security Rules** - Protect your database/storage
3. **Enable App Check** - Protect against abuse (recommended for production)
4. **Rate Limiting** - Firebase automatically implements some rate limiting
5. **Monitor Usage** - Check Firebase Console regularly for unusual activity
6. **Validate on Backend** - Always verify tokens on your backend API

---

## 📚 Additional Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)

---

## ✅ Checklist

Before deploying to production:

- [ ] Firebase project created
- [ ] Phone authentication enabled in Firebase Console
- [ ] Authorized domains added (localhost, production domain)
- [ ] Environment variables configured
- [ ] Billing enabled on Firebase (for SMS in production)
- [ ] Test phone numbers configured (optional, for testing)
- [ ] Error handling implemented
- [ ] Session management working
- [ ] Security rules configured
- [ ] App tested on localhost
- [ ] App tested on production domain

---

## 💡 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase Console for authentication logs
3. Review the troubleshooting section above
4. Check Firebase status page for service outages
5. Review Firebase documentation for latest updates
