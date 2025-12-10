# Profile Completion & Account Creation Flow

## Overview
When users sign in with Google or Microsoft OAuth, they are now guided through a profile completion page that:
1. ✅ Pre-fills data from their OAuth account (name, email, avatar)
2. ✅ Asks for additional required information (phone, degree, etc.)
3. ✅ Creates a complete IDEA Lab account with all their data
4. ✅ Stores user data in localStorage with JWT token
5. ✅ Redirects to dashboard

## Flow Diagram

```
User clicks "Sign in with Google/Microsoft"
         ↓
User selects role (University Member / Guest User)
         ↓
Frontend calls loginWithGoogle() / loginWithMicrosoft()
         ↓
Redirected to OAuth provider (Google/Microsoft)
         ↓
User logs in with provider
         ↓
OAuth provider redirects to /api/auth/google/callback or /api/auth/microsoft/callback
         ↓
Server exchanges code for JWT token and fetches user profile
         ↓
Server redirects to /#/auth/google/callback?code=...
         ↓
GoogleCallback/MicrosoftCallback component
  - Exchanges code for JWT token
  - Stores OAuth user data in localStorage
  - Redirects to /complete-profile?type=...
         ↓
CompleteProfile page
  - Pre-fills form with Google/OAuth data
  - User completes additional fields
  - Creates IDEA Lab account
  - Redirects to dashboard
         ↓
✅ User logged in and account created
```

## Pages & Components

### 1. **pages/CompleteProfile.tsx** (NEW)
Handles profile completion after OAuth authentication.

**Features:**
- ✅ Pre-fills name, email, and avatar from OAuth provider
- ✅ Prompts for phone number (required)
- ✅ User type selection (University Member / Guest User)
- ✅ University-specific fields:
  - Student Registration Number (SRN)
  - Degree (B.Tech, M.Tech, etc.)
  - Program/Branch (CS, Electronics, etc.)
  - Department
  - Institution
- ✅ Form validation
- ✅ Success animation with redirect to dashboard

**Component Props:**
```typescript
interface CompleteProfileProps {
  onProfileComplete: (user: any) => void;
}
```

### 2. **pages/GoogleCallback.tsx** (UPDATED)
Updated to redirect to profile completion instead of dashboard.

**Changes:**
- ✅ Stores OAuth user data in `localStorage.idea_lab_oauth_user`
- ✅ Stores JWT token in `localStorage.idea_lab_jwt_token`
- ✅ Redirects to `/complete-profile?type=...` instead of `/`

### 3. **pages/MicrosoftCallback.tsx** (UPDATED)
Same changes as GoogleCallback.

### 4. **pages/Login.tsx** (UPDATED)
Now passes user type to OAuth functions.

**Changes:**
- ✅ `loginWithGoogle(selectedRole)` - Passes user type to OAuth flow
- ✅ `loginWithMicrosoft(selectedRole)` - Passes user type to OAuth flow

### 5. **services/api.ts** (UPDATED)
OAuth service functions now accept userType parameter.

**Function Signatures:**
```typescript
loginWithGoogle(userType?: 'university' | 'non-university'): Promise<User>
loginWithMicrosoft(userType?: 'university' | 'non-university'): Promise<User>
```

### 6. **App.tsx** (UPDATED)
Added route for profile completion.

```typescript
<Route 
  path="/complete-profile" 
  element={<CompleteProfile onProfileComplete={handleProfileComplete} />}
/>
```

## Data Flow

### Storage Keys

**During OAuth:**
```javascript
// Temporary OAuth data
localStorage.setItem('idea_lab_oauth_user', JSON.stringify({
  id: 'USR-123456',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://...',
}))

// JWT token from server
localStorage.setItem('idea_lab_jwt_token', 'eyJhbGc...')
```

**After Profile Completion:**
```javascript
// Complete user profile
localStorage.setItem('idea_lab_current_user', JSON.stringify({
  id: 'USR-123456',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://...',
  phone: '+91 98765 43210',
  type: 'non-university' | 'university',
  isProfileComplete: true,
  srn: '21BCE0XXX',         // For university members
  degree: 'B.Tech',         // For university members
  program: 'Computer Science',  // For university members
  department: 'IDEA Lab',   // For university members
  institution: 'REVA University' // For university members
}))

// Keep JWT token
localStorage.setItem('idea_lab_current_user_token', 'eyJhbGc...')
```

## Form Fields by User Type

### Guest User
- Name *
- Email * (read-only, from OAuth)
- Phone *

### University Member
- Name *
- Email * (read-only, from OAuth)
- Phone *
- Student Registration Number (SRN) *
- Degree *
- Program/Branch *
- Department (optional)
- Institution (optional)

## Testing the Flow

### Test Case 1: Google Sign-In (Guest User)
```
1. Open http://localhost:3000
2. Click "Guest User" → "Sign in with Google"
3. Select "Guest User" on method selection
4. Log in with Google
5. Complete Profile form should appear
6. Fill: Name, Phone
7. Click "Complete Profile"
8. Should redirect to dashboard with user logged in
```

### Test Case 2: Google Sign-In (University Member)
```
1. Open http://localhost:3000
2. Click "University Member" → (method selection will show)
3. Click "Sign in with Google" (if available) or use phone/OTP
4. Complete Profile form should appear
5. Select "University Member"
6. Fill all fields including SRN, Degree, Program
7. Click "Complete Profile"
8. Should redirect to dashboard as university member
```

### Test Case 3: Microsoft Sign-In
```
1. Open http://localhost:3000
2. Click "University Member" → "Sign in with Microsoft"
3. Log in with Microsoft
4. Complete Profile form should appear with type="university"
5. Fill fields
6. Click "Complete Profile"
8. Should redirect to dashboard
```

## Environment Configuration

### OAuth Redirect URIs
Make sure these are configured in your OAuth providers:

**Google Cloud Console:**
```
http://localhost:3001/api/auth/google/callback
```

**Microsoft Entra Admin Center:**
```
http://localhost:3001/api/auth/microsoft/callback
```

## Features Implemented

✅ **Auto-fill from OAuth**
- User name from provider
- User email from provider
- User avatar from provider

✅ **Role-based Profile**
- Different form fields for university vs guest users
- Validation based on user type

✅ **Data Persistence**
- User data stored in localStorage
- JWT token secured
- isProfileComplete flag set to true

✅ **User Experience**
- Loading spinner during OAuth exchange
- Error handling with retry link
- Success animation before redirect
- Form validation with helpful error messages

✅ **Type Safety**
- Full TypeScript support
- Type checking for user roles and fields
- Proper interface definitions

## Next Steps

1. Test OAuth flow end-to-end
2. Verify profile data is correctly saved
3. Test university-specific fields
4. Configure Microsoft OAuth if needed
5. Add profile editing page (future)
6. Add user settings/preferences page (future)
