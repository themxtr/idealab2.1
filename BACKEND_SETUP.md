# Backend Installation & Deployment Guide

## Quick Start

### 1. Install Backend Dependencies

Run these commands from the project root:

```powershell
# Core packages for backend
npm install jsonwebtoken form-data multer @vercel/node cross-fetch googleapis

# Type definitions
npm install --save-dev @types/jsonwebtoken @types/multer @types/node
```

### Complete NPM Install Command (Copy & Paste)

```powershell
npm install jsonwebtoken form-data multer @vercel/node cross-fetch googleapis && npm install --save-dev @types/jsonwebtoken @types/multer @types/node
```

### 2. Create `.env.local` File

Create a file named `.env.local` in your project root:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Microsoft OAuth2
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback
```

## Getting OAuth Credentials

### Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.vercel.app/api/auth/google/callback`
7. Copy `Client ID` and `Client Secret`

### Microsoft OAuth2

1. Go to [Microsoft Entra ID](https://entra.microsoft.com/)
2. Go to "Applications" → "App registrations"
3. Click "New registration"
4. Enter app name (e.g., "AICTE Idea Lab")
5. Go to "Certificates & secrets"
6. Create a new client secret (copy the value, not the ID)
7. Go to "Authentication" → "Platform configurations"
8. Add "Web" platform with redirect URIs:
   - Development: `http://localhost:3000/api/auth/microsoft/callback`
   - Production: `https://yourdomain.vercel.app/api/auth/microsoft/callback`
9. Copy Application (Client) ID

## Local Testing

```powershell
# Start development server
npm run dev

# Test endpoints with curl
curl http://localhost:3000/api/auth/google

curl http://localhost:3000/api/pcb/builder

curl -X POST http://localhost:3000/api/stl/price ^
  -H "Content-Type: application/json" ^
  -d "{\"grams\": 100, \"userType\": \"student\"}"
```

## Vercel Deployment

### 1. Prepare Repository

```powershell
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with complete backend"

# Push to GitHub (must be on GitHub for Vercel)
git push origin main
```

### 2. Deploy to Vercel

**Option A: Using Vercel CLI**

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Option B: Using Vercel Dashboard**

1. Visit https://vercel.com/new
2. Select your GitHub repository
3. Click "Import"
4. Vercel will auto-detect settings
5. Click "Deploy"

### 3. Set Production Environment Variables

In Vercel Dashboard:

1. Go to your project
2. Click "Settings"
3. Go to "Environment Variables"
4. Add each variable:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Generate a strong random string (min 32 chars) |
| `GOOGLE_CLIENT_ID` | Your Google Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://yourdomain.vercel.app/api/auth/google/callback` |
| `MICROSOFT_CLIENT_ID` | Your Microsoft Client ID |
| `MICROSOFT_CLIENT_SECRET` | Your Microsoft Client Secret |
| `MICROSOFT_REDIRECT_URI` | `https://yourdomain.vercel.app/api/auth/microsoft/callback` |

5. Save and redeploy

### 4. Update OAuth Redirect URIs

**Google Console:**
- Go to your OAuth app settings
- Add redirect URI: `https://yourdomain.vercel.app/api/auth/google/callback`

**Microsoft Entra ID:**
- Go to your app registration
- Add redirect URI: `https://yourdomain.vercel.app/api/auth/microsoft/callback`

## Vercel Environment Variables in Code

All environment variables are automatically available:

```typescript
// In any API route
const jwtSecret = process.env.JWT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
```

## Project Structure After Setup

```
d:\aicte-idea-labv5\
├── api/
│   ├── auth/
│   │   ├── google.ts
│   │   └── microsoft.ts
│   ├── stl/
│   │   ├── upload.ts
│   │   ├── analyze.ts
│   │   └── price.ts
│   ├── pcb/
│   │   ├── builder.ts
│   │   └── options.json
│   └── user/
│       └── session.ts
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── ...
├── .env.local (not in git)
├── .gitignore
├── vercel.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Update package.json Scripts

Your `package.json` should already have these, but ensure they exist:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

## Testing the Backend

### 1. Test JWT Session

```powershell
# Create session
$body = @{
    id = "test-user-123"
    email = "test@example.com"
    name = "Test User"
    provider = "google"
} | ConvertTo-Json

curl.exe -X POST http://localhost:3000/api/user/session `
  -H "Content-Type: application/json" `
  -d $body
```

### 2. Test 3D Printing Price

```powershell
$price = @{
    grams = 100
    userType = "student"
} | ConvertTo-Json

curl.exe -X POST http://localhost:3000/api/stl/price `
  -H "Content-Type: application/json" `
  -d $price
```

### 3. Test PCB Builder

```powershell
curl.exe http://localhost:3000/api/pcb/builder

# Get PCB options (GET request)
$pcb = @{
    width = 100
    height = 80
    layerCount = 4
    color = "green"
    copperThickness = "1oz"
} | ConvertTo-Json

curl.exe -X POST http://localhost:3000/api/pcb/builder `
  -H "Content-Type: application/json" `
  -d $pcb
```

## Common Issues & Solutions

### Issue: "Module not found"
**Solution**: Run `npm install` to install dependencies

### Issue: Environment variables undefined
**Solution**: 
- Development: Create `.env.local` file
- Vercel: Set in project settings

### Issue: CORS errors
**Solution**: All endpoints already have CORS headers enabled

### Issue: OAuth redirect not working
**Solution**: 
- Update redirect URI in Google/Microsoft console
- Ensure environment variable is set correctly
- Use HTTPS in production

### Issue: Vercel deployment fails
**Solution**:
- Check build logs: `vercel logs <project>`
- Ensure all dependencies are listed in `package.json`
- Verify environment variables are set

## Next Steps

1. ✅ Backend files created
2. ✅ Dependencies listed below
3. ✅ Environment variables documented
4. Install dependencies
5. Create `.env.local` with your credentials
6. Test locally with `npm run dev`
7. Push to GitHub
8. Deploy to Vercel
9. Set production environment variables
10. Update OAuth redirect URIs

## All Required npm Commands

Run these commands in order:

```powershell
# Install all dependencies at once
npm install jsonwebtoken form-data multer @vercel/node cross-fetch googleapis && npm install --save-dev @types/jsonwebtoken @types/multer @types/node

# Or run separately:
npm install jsonwebtoken form-data multer @vercel/node cross-fetch googleapis
npm install --save-dev @types/jsonwebtoken @types/multer @types/node

# Verify installation
npm list jsonwebtoken

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Production Checklist

- [ ] All dependencies installed
- [ ] `.env.local` created with development values
- [ ] Tested locally with `npm run dev`
- [ ] Generated OAuth credentials (Google & Microsoft)
- [ ] Pushed code to GitHub
- [ ] Created Vercel project
- [ ] Set environment variables in Vercel
- [ ] Updated OAuth redirect URIs in Google Console
- [ ] Updated OAuth redirect URIs in Microsoft Entra ID
- [ ] Verified deployment at `https://yourdomain.vercel.app`
- [ ] Tested all endpoints in production
- [ ] Added custom domain (optional)
- [ ] Set up monitoring/logs

---

**Backend setup complete!** Proceed with testing and deployment.
