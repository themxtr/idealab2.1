# Microsoft OAuth (Entra ID) Setup Guide

## Overview
This guide walks you through setting up Microsoft Entra ID (Azure AD) OAuth authentication for your AICTE Idea Lab v5 application. This supports both personal Microsoft accounts and work/school accounts.

## Prerequisites
- A Microsoft account
- Access to [Azure Portal](https://portal.azure.com/) or [Microsoft Entra ID Admin Center](https://entra.microsoft.com/)
- The application deployed or running locally

## Step 1: Access Microsoft Entra ID

### Option A: Via Azure Portal
1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign in with your Microsoft account
3. Search for **Azure Active Directory** (or **Entra ID**)
4. Click on it to open the Entra ID admin center

### Option B: Direct Link
Go directly to [Microsoft Entra ID Admin Center](https://entra.microsoft.com/)

## Step 2: Register Your Application

1. In the Entra ID admin center, click **Applications** in the left sidebar
2. Click **App registrations**
3. Click **+ New registration**

### Registration Details
- **Name**: `AICTE Idea Lab`
- **Supported account types**: Select `Accounts in any organizational directory and personal Microsoft accounts`
- **Redirect URI**: Leave empty for now (we'll add it after registration)

4. Click **Register**
5. You'll be redirected to your app's overview page

## Step 3: Copy Application Credentials

From the **Overview** page, copy:
- **Application (client) ID** - This is your Client ID
- **Directory (tenant) ID** - This is your Tenant ID

Store these values safely.

## Step 4: Create Client Secret

1. In the left sidebar under your app registration, click **Certificates & secrets**
2. Click **+ New client secret**
3. Enter description: `AICTE Idea Lab Secret`
4. Select expiration: `24 months` (or your preference)
5. Click **Add**
6. **Important**: Copy the **Value** immediately (you won't be able to see it again)

Store this value in a secure location.

## Step 5: Configure Redirect URIs

1. In the left sidebar, click **Authentication**
2. Click **+ Add a platform**
3. Select **Web**

### Add Redirect URIs

Add all the following redirect URIs:

**For Local Development (Vite):**
```
http://localhost:5173/api/auth/microsoft/callback
http://localhost:5173
```

**For Production (Vercel):**
```
https://yourdomain.com/api/auth/microsoft/callback
https://yourdomain.com
```

**Note:** Replace `yourdomain.com` with your actual Vercel deployment URL (e.g., `aicte-idea-lab.vercel.app`)

4. Click **Configure** to save

## Step 6: Configure API Permissions

1. In the left sidebar, click **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph** from the list
4. Select **Delegated permissions**
5. Search for and add the following permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`

6. Click **Add permissions**
7. Click **Grant admin consent for...** (if available)

## Step 7: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_TENANT_ID=your_tenant_id_here
```

### File Location
Create or edit `.env.local` in the root of your project:

```
d:\aicte-idea-labv5\.env.local
```

### Complete .env.local Example:
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
GOOGLE_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012
MICROSOFT_CLIENT_SECRET=abc123def456ghi789~jkl.mnopqr-stuvwxyz
MICROSOFT_TENANT_ID=87654321-4321-4321-4321-210987654321

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here-min-32-characters

# API URL (adjust based on environment)
VITE_API_URL=http://localhost:5173/api
```

## Step 8: Test Locally

1. Stop any running dev server
2. Run `npm run dev` in the project root
3. Navigate to `http://localhost:5173`
4. Click "Login with Microsoft"
5. You should be redirected to Microsoft login
6. Choose "Sign in" for personal account or "Sign in to your organization"
7. After login, you should be redirected back to the app

## Step 9: Deploy to Vercel

When deploying to Vercel:

1. Go to your Vercel project settings
2. Add environment variables:
   - `MICROSOFT_CLIENT_ID`: Your Client ID
   - `MICROSOFT_CLIENT_SECRET`: Your Client Secret
   - `MICROSOFT_TENANT_ID`: Your Tenant ID
   - `VITE_MICROSOFT_CLIENT_ID`: Your Client ID (for frontend)

3. Update Microsoft Entra ID redirect URIs to use your Vercel URL:
   - `https://yourdomain.vercel.app/api/auth/microsoft/callback`
   - `https://yourdomain.vercel.app`

## Tenant ID vs Common Endpoint

### Using Tenant-Specific Endpoint (Recommended)
- **Endpoint**: `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize`
- **Benefit**: Faster login, works only with your organization
- **Use**: When users are from specific organizations
- **Set**: `MICROSOFT_TENANT_ID=your_tenant_id`

### Using Common Endpoint
- **Endpoint**: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Benefit**: Works with personal and organizational accounts
- **Use**: When allowing any Microsoft account
- **Set**: `MICROSOFT_TENANT_ID=common`

**Current Implementation**: Uses tenant-specific endpoint for better security

## Troubleshooting

### "redirect_uri_mismatch" Error
- **Cause**: The redirect URL doesn't match what's registered
- **Solution**: 
  1. Go to **Authentication** in Entra ID
  2. Verify the redirect URI is exactly as shown in the error
  3. Ensure it matches `yourdomain.com/api/auth/microsoft/callback`

### "Invalid client ID" or "Client not found"
- **Cause**: Environment variable not set or incorrect value
- **Solution**:
  - Verify `.env.local` contains `MICROSOFT_CLIENT_ID`
  - Check the value matches your registered app
  - Restart the dev server

### "Unauthorized client" Error
- **Cause**: App is not configured to accept the authentication request
- **Solution**:
  1. Go to **Authentication** in Entra ID
  2. Ensure "Allow public client flows" is enabled
  3. Verify API permissions are configured

### "AADSTS50105: Application not found in the directory"
- **Cause**: Incorrect tenant ID or client ID
- **Solution**:
  - Copy the exact Client ID and Tenant ID from Entra ID
  - Verify they're set in `.env.local`

### Token Expiration Issues
- **Cause**: Client Secret expired
- **Solution**:
  1. Go to **Certificates & secrets**
  2. Add a new client secret with longer expiration
  3. Update `.env.local` and Vercel environment variables
  4. Delete the old secret

## Supported Account Types

The current setup supports:

1. **Personal Microsoft Accounts**
   - Users can sign in with @outlook.com, @hotmail.com, etc.
   - No organization required

2. **Work/School Accounts**
   - Users from any Azure AD organization
   - Requires organization admin consent for first-time users

3. **Custom Organizations**
   - To restrict to specific organizations only:
     - Change "Supported account types" during registration
     - Select "Accounts in this organizational directory only"
     - Set `MICROSOFT_TENANT_ID` to your organization's tenant ID

## API Implementation Details

The Microsoft OAuth flow is implemented in `api/auth/microsoft.ts`:

**GET Request:** Returns the Microsoft login URL
```
GET /api/auth/microsoft
Response: { 
  microsoftAuthUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?..."
}
```

**POST Request:** Processes the callback with authorization code
```
POST /api/auth/microsoft
Body: { code: "authorization_code_from_microsoft" }
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

3. **Rotate secrets regularly**
   - Add new secret before deleting old one
   - Update environment variables
   - Redeploy application

4. **Use HTTPS in production**
   - Microsoft requires secure redirects

5. **Limit API permissions**
   - Only request necessary permissions
   - Remove unused permissions

6. **Monitor access**
   - Check Entra ID sign-in logs
   - Review registered applications periodically

## Multi-Organization Setup

To support users from multiple organizations:

1. Set `MICROSOFT_TENANT_ID=common` in `.env.local`
2. Users will see organization selection screen
3. First-time users from new organizations may require admin consent
4. No additional configuration needed per organization

## Comparison: Google vs Microsoft OAuth

| Feature | Google | Microsoft |
|---------|--------|-----------|
| Setup Complexity | Low | Medium |
| Personal Accounts | Yes | Yes |
| Work Accounts | Limited | Full Support |
| Multi-Organization | Easy | Built-in |
| Admin Consent | No | Optional |
| User Profile Data | Basic | Comprehensive |
| Implementation | `api/auth/google.ts` | `api/auth/microsoft.ts` |

## Additional Resources

- [Microsoft Entra ID Admin Center](https://entra.microsoft.com/)
- [Azure Portal](https://portal.azure.com/)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [OAuth 2.0 and OpenID Connect in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-v2-protocols)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/overview)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Next Steps

1. **Complete Google OAuth setup** (if not already done) - See `GOOGLE_OAUTH_SETUP.md`
2. **Configure JWT Secret** in `.env.local`
3. **Test both login flows** locally
4. **Deploy to Vercel** with all environment variables
5. **Monitor authentication logs** in Entra ID

---

**Created**: 2024
**For**: AICTE Idea Lab v5
**Status**: Complete Backend Setup
