# Google OAuth Client ID Setup Guide

## Overview
This guide walks you through obtaining a Google Client ID and Secret to enable Google sign-in for your AICTE Idea Lab v5 application.

## Prerequisites
- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- The application deployed or running locally

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **Project** dropdown at the top of the page
3. Click **NEW PROJECT**
4. Enter project name: `AICTE Idea Lab`
5. Click **CREATE**
6. Wait for the project to be created (this may take a minute)

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for `Google+ API`
3. Click on **Google+ API** from the results
4. Click the **ENABLE** button
5. Wait for the API to be enabled

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**
4. You'll see a message: "To create an OAuth client ID, you must first set a user consent screen"
5. Click **CONFIGURE CONSENT SCREEN**

## Step 4: Configure OAuth Consent Screen

### User Type Selection
1. Choose **External** (unless your app is internal-only to your organization)
2. Click **CREATE**

### Consent Screen Configuration
Fill in the following required fields:

- **App name**: `AICTE Idea Lab`
- **User support email**: Your email address
- **App logo** (optional): You can add the app logo if you have one
- **Developer contact information**: Your email address

Click **SAVE AND CONTINUE**

### Scopes
1. Click **ADD OR REMOVE SCOPES**
2. Add the following scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
3. Click **SAVE AND CONTINUE**

### Test Users
1. Click **ADD USERS**
2. Add test user email addresses (your email, team members, etc.)
3. Click **SAVE AND CONTINUE**

### Summary
Review the information and click **BACK TO DASHBOARD**

## Step 5: Create OAuth 2.0 Client ID

1. Go back to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Web application** from the dropdown
4. Enter name: `AICTE Idea Lab Web Client`

### Add Authorized Redirect URIs

Add the following redirect URIs based on your environment:

**For Local Development (Vite):**
```
http://localhost:5173/api/auth/google/callback
http://localhost:5173
```

**For Production (Vercel):**
```
https://yourdomain.com/api/auth/google/callback
https://yourdomain.com
```

**Note:** Replace `yourdomain.com` with your actual Vercel deployment URL (e.g., `aicte-idea-lab.vercel.app`)

### Add Authorized JavaScript Origins

Add these origins:

**For Local Development:**
```
http://localhost:5173
http://localhost:3000
```

**For Production:**
```
https://yourdomain.com
```

5. Click **CREATE**
6. A popup will show your credentials

## Step 6: Copy Your Credentials

From the OAuth 2.0 Client popup, copy:
- **Client ID** (looks like: `1234567890-abc123def456ghi789.apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-xxxxxxxxxxxxx`)

## Step 7: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### File Location
Create or edit `.env.local` in the root of your project:

```
d:\aicte-idea-labv5\.env.local
```

### Example .env.local file:
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
GOOGLE_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here-min-32-characters

# API URL (adjust based on environment)
VITE_API_URL=http://localhost:5173/api
```

## Step 8: Test Locally

1. Stop any running dev server
2. Run `npm run dev` in the project root
3. Navigate to `http://localhost:5173`
4. Click "Login with Google"
5. You should be redirected to Google login
6. After login, you should be redirected back to the app

## Step 9: Deploy to Vercel

When deploying to Vercel:

1. Go to your Vercel project settings
2. Add environment variables:
   - `GOOGLE_CLIENT_ID`: Your Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Client Secret
   - `JWT_SECRET`: A strong random string
   - `VITE_GOOGLE_CLIENT_ID`: Your Client ID (for frontend)
   - `VITE_API_URL`: `https://yourdomain.vercel.app/api`

3. Update Google Cloud Console redirect URIs to use your Vercel URL:
   - `https://yourdomain.vercel.app/api/auth/google/callback`
   - `https://yourdomain.vercel.app`

## Troubleshooting

### "redirect_uri_mismatch" Error
- **Cause**: The redirect URL in Google Console doesn't match the one in your app
- **Solution**: Ensure the redirect URI in Google Cloud Console exactly matches the one in your API
- **Check**: Is it `http://` vs `https://`? Does it include/exclude trailing slash?

### "Invalid Client ID" Error
- **Cause**: Environment variable not loaded or incorrect value
- **Solution**: 
  - Verify `.env.local` is in the project root
  - Check that `VITE_GOOGLE_CLIENT_ID` is set
  - Restart the dev server after updating `.env.local`

### "Unauthorized redirect_uri"
- **Cause**: The redirect URI is not in the authorized list
- **Solution**: Add the redirect URI to Google Cloud Console:
  1. Go to Credentials
  2. Click on your OAuth 2.0 Client ID
  3. Add the missing URI to "Authorized redirect URIs"
  4. Click Save

### CORS Errors
- **Cause**: Browser blocking requests to Google
- **Solution**: Ensure the JavaScript origin is whitelisted in Google Cloud Console

## API Implementation Details

The Google OAuth flow is implemented in `api/auth/google.ts`:

**GET Request:** Returns the Google login URL
```
GET /api/auth/google
Response: { googleAuthUrl: "https://accounts.google.com/o/oauth2/v2/auth?..." }
```

**POST Request:** Processes the callback with authorization code
```
POST /api/auth/google
Body: { code: "authorization_code_from_google" }
Response: { 
  success: true, 
  token: "jwt_token", 
  user: { 
    id, email, name, picture, provider, createdAt 
  } 
}
```

## Security Best Practices

1. **Never commit `.env.local` to Git**
   - Add `*.env.local` to `.gitignore`

2. **Keep Client Secret confidential**
   - Only store on backend/server
   - Never expose in frontend code

3. **Use HTTPS in production**
   - Google requires secure redirects for production

4. **Rotate secrets periodically**
   - Update Client Secret in Google Console
   - Update environment variables
   - Redeploy application

5. **Generate strong JWT Secret**
   ```bash
   # Generate a random string (use in .env.local)
   openssl rand -base64 32
   ```

## Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Next Steps

After setting up Google OAuth:

1. **Set up Microsoft OAuth** (optional) - See `MICROSOFT_OAUTH_SETUP.md`
2. **Configure JWT Secret** in `.env.local`
3. **Test all login flows** locally
4. **Deploy to Vercel** with environment variables
5. **Monitor OAuth logs** in Google Cloud Console

---

**Created**: 2024
**For**: AICTE Idea Lab v5
**Status**: Complete Backend Setup
