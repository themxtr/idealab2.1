# Quick Start: Profile Completion Feature

## What's New ✨

After OAuth login (Google/Microsoft), users now complete their IDEA Lab profile with:
- ✅ Auto-filled data from their OAuth account
- ✅ Additional profile information collection
- ✅ Role-based fields (University Member vs Guest User)
- ✅ Comprehensive user account creation

## How It Works

### 1. User Logs In with OAuth
```
Google/Microsoft → OAuth Provider → API Server → Frontend Callback
```

### 2. OAuth Data Stored Temporarily
```javascript
localStorage.setItem('idea_lab_oauth_user', {
  name, email, avatar // from OAuth provider
})
```

### 3. Profile Completion Page
- Form pre-filled with OAuth data
- Ask for phone number
- Ask for university details (if university member)
- Full form validation

### 4. Account Created
```javascript
localStorage.setItem('idea_lab_current_user', {
  ...oauthData,
  phone,
  type: 'university' | 'non-university',
  isProfileComplete: true,
  srn, degree, program // for university members
})
```

### 5. Redirect to Dashboard
User logged in and ready to use IDEA Lab!

## New Files Created

| File | Purpose |
|------|---------|
| `pages/CompleteProfile.tsx` | Profile completion form page |
| `PROFILE_COMPLETION_GUIDE.md` | Detailed documentation |

## Modified Files

| File | Changes |
|------|---------|
| `pages/GoogleCallback.tsx` | Now redirects to profile completion |
| `pages/MicrosoftCallback.tsx` | Now redirects to profile completion |
| `pages/Login.tsx` | Passes user type to OAuth functions |
| `services/api.ts` | OAuth functions accept userType parameter |
| `App.tsx` | Added route for `/complete-profile` |

## Testing

### Try the Full Flow
1. Open http://localhost:3000
2. Click "Guest User" → "Sign in with Google"
3. Complete the profile form
4. Check browser console for logs
5. Should be logged in on dashboard

## Code Example

### Login with Role
```typescript
// In Login.tsx
await authService.loginWithGoogle('non-university');
await authService.loginWithMicrosoft('university');
```

### Profile Completion
```typescript
// In CompleteProfile.tsx
const completeUser = {
  id: oauthUser.id,
  name: formData.name,
  email: formData.email,
  avatar: oauthUser.avatar,
  phone: formData.phone,
  type: userType,
  isProfileComplete: true,
  srn: userType === 'university' ? formData.srn : undefined,
  degree: userType === 'university' ? formData.degree : undefined,
  program: userType === 'university' ? formData.program : undefined,
}
```

## Form Fields

### All Users (Required)
- Name (auto-filled from OAuth)
- Email (auto-filled from OAuth, read-only)
- Phone (user enters)

### University Members (Additional)
- Student Registration Number (SRN)
- Degree (B.Tech, M.Tech, etc.)
- Program/Branch (CS, Electronics, etc.)
- Department (optional)
- Institution (optional)

## Storage Structure

```javascript
// OAuth temporary storage (cleared after completion)
idea_lab_oauth_user = {
  id, name, email, avatar
}

// Final user profile
idea_lab_current_user = {
  id, name, email, avatar,
  phone, type, isProfileComplete,
  srn?, degree?, program?, department?, institution?
}

// JWT token
idea_lab_jwt_token = "eyJhbGc..."
```

## Features

✅ Form pre-fills with OAuth data
✅ Responsive design (mobile-friendly)
✅ Form validation
✅ Loading states
✅ Error handling
✅ Success animation
✅ Auto-redirect after completion
✅ Type-safe TypeScript
✅ Accessibility support

## Troubleshooting

### Profile page doesn't load after OAuth
- Check browser console for errors
- Verify `localStorage.idea_lab_oauth_user` exists
- Check that API server is running on port 3001

### Form doesn't auto-fill
- Check browser console
- Verify OAuth provider returned user data
- Check `localStorage.idea_lab_oauth_user` contents

### Can't find user data after completing profile
- Check `localStorage.idea_lab_current_user` exists
- Verify `isProfileComplete` is set to `true`
- Check browser DevTools → Application → LocalStorage

## Next Features (Future)

- Edit profile page
- Upload profile picture
- Change password
- Two-factor authentication
- Email verification
- Social media links
- Resume upload
