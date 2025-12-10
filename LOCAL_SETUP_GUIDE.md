# Local Development Setup - Complete

## ✅ Running Services

### Frontend Server
- **URL**: http://localhost:3000
- **Command**: `npm run dev`
- **Technology**: Vite + React
- **Status**: Running

### API Server
- **URL**: http://localhost:3001
- **Command**: `node server.js`
- **Technology**: Express.js
- **Status**: Running

## 🔄 OAuth Flow

### Google OAuth
1. User clicks "Sign in with Google"
2. Frontend calls: `GET http://localhost:3001/api/auth/google`
3. Backend returns Google OAuth URL
4. Frontend redirects user to Google login
5. Google redirects to: `GET http://localhost:3001/api/auth/google/callback?code=ABC123`
6. Server redirects to: `http://localhost:3000/#/auth/google/callback?code=ABC123`
7. Frontend GoogleCallback component exchanges code for JWT token
8. User logged in ✅

### Microsoft OAuth
Same flow as Google but for Microsoft Entra ID

## 🔧 Configuration

### Google Cloud Console Setup (IMPORTANT!)
You need to update your Google OAuth configuration:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. In **Authorized redirect URIs**, update to:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
   (This was the issue - it needs to be port 3001 where the API server runs)
5. Click **Save**

### Current .env.local
```
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/auth/microsoft/callback
```

## 🧪 Testing

### Quick Test
1. Open http://localhost:3000 in your browser
2. Click "Guest User" → "Sign in with Google"
3. You should be redirected to Google login
4. After logging in, you should be back on the app and logged in
5. Check browser console (F12) for debug logs

### Debug Logs
The API server logs all OAuth traffic to console:
```
[Google OAuth] Generated auth URL: ...
[Google OAuth] Exchanging code for token...
[Google Callback] Received from Google: ...
```

## 📁 Key Files

- `server.js` - Local Express API server (serves /api endpoints)
- `services/api.ts` - Frontend OAuth service (calls backend)
- `pages/GoogleCallback.tsx` - Frontend Google OAuth callback handler
- `pages/MicrosoftCallback.tsx` - Frontend Microsoft OAuth callback handler
- `pages/Login.tsx` - Login page with OAuth buttons
- `.env.local` - Environment variables

## ⚡ Running Both Servers

### Terminal 1 - API Server
```powershell
cd d:\aicte-idea-labv5
node server.js
```

### Terminal 2 - Frontend Server
```powershell
cd d:\aicte-idea-labv5
npm run dev
```

Both should run simultaneously.

## 🚨 Common Issues

### "Button doesn't redirect"
**Solution**: Make sure both servers are running:
- API server on port 3001 (runs `server.js`)
- Frontend on port 3000 (runs `npm run dev`)

### "OAuth redirect failed"
**Solution**: Update Google Cloud Console with the correct redirect URI:
- Old (wrong): `http://localhost:3000/#/auth/google/callback`
- New (correct): `http://localhost:3001/api/auth/google/callback`

### "Network error when clicking button"
**Solution**: Check that:
1. API server is running on port 3001
2. Firewall allows localhost:3001
3. Browser console shows which endpoint failed

### "Google login page doesn't open"
**Solution**: 
1. Check Google Cloud Console has your Client ID and Secret correct
2. Check Google Cloud Console has the redirect URI configured correctly
3. Check browser console for specific error messages

## 📋 API Endpoints Available

### Google OAuth
- `GET /api/auth/google` - Get Google OAuth URL
- `POST /api/auth/google` - Exchange code for token (called by GoogleCallback.tsx)
- `GET /api/auth/google/callback` - Server redirect handler

### Microsoft OAuth
- `GET /api/auth/microsoft` - Get Microsoft OAuth URL
- `POST /api/auth/microsoft` - Exchange code for token (called by MicrosoftCallback.tsx)
- `GET /api/auth/microsoft/callback` - Server redirect handler

### Health Check
- `GET /api/health` - Server status

## 🚀 Next Steps

1. ✅ Test Google OAuth flow (click button and verify redirect)
2. Get Microsoft Entra ID Client ID and Secret
3. Configure Microsoft OAuth in `.env.local`
4. Test Microsoft OAuth flow
5. Deploy to Vercel (will use serverless functions instead of server.js)

## 📚 Documentation
- [OAuth_SETUP_NEXT_STEPS.md](./OAUTH_SETUP_NEXT_STEPS.md) - Detailed setup guide
