# Backend API Documentation

Complete production-ready backend for AICTE Idea Lab v5 frontend.

## Directory Structure

```
api/
├── auth/
│   ├── google.ts          # Google OAuth2 implementation
│   └── microsoft.ts       # Microsoft Entra ID OAuth2 implementation
├── stl/
│   ├── upload.ts          # STL file upload handler
│   ├── analyze.ts         # STL file analysis and metrics
│   └── price.ts           # 3D printing price calculator
├── pcb/
│   ├── builder.ts         # PCB builder with validation
│   └── options.json       # PCB configuration options
└── user/
    └── session.ts         # JWT session management

vercel.json               # Vercel deployment configuration
```

## Environment Variables Required

Create a `.env.local` file with the following variables:

```bash
# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-recommended

# Google OAuth2 (Required for Google login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
# Production: GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# Microsoft OAuth2 (Required for Microsoft login)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback
# Production: MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/auth/microsoft/callback
```

## API Endpoints

### Authentication

#### Google OAuth2
- **GET `/api/auth/google`** - Get Google login URL
  ```json
  Response: { success: true, url: "https://accounts.google.com/..." }
  ```

- **POST `/api/auth/google`** - Handle Google callback
  ```json
  Body: { code: "authorization-code" }
  Response: {
    success: true,
    token: "jwt-token",
    user: {
      id: "google-user-id",
      email: "user@gmail.com",
      name: "John Doe",
      picture: "https://...",
      provider: "google",
      createdAt: "2025-12-09T..."
    }
  }
  ```

#### Microsoft OAuth2
- **GET `/api/auth/microsoft`** - Get Microsoft login URL
  ```json
  Response: { success: true, url: "https://login.microsoftonline.com/..." }
  ```

- **POST `/api/auth/microsoft`** - Handle Microsoft callback
  ```json
  Body: { code: "authorization-code" }
  Response: { success: true, token, user }
  ```

### 3D Printing (STL)

#### Upload
- **POST `/api/stl/upload`** - Upload STL file
  ```
  Content-Type: application/octet-stream
  Body: Binary STL file
  Response: {
    success: true,
    fileReference: {
      id: "stl_timestamp",
      filename: "stl_timestamp.stl",
      size: 1024000,
      buffer: "base64-encoded-buffer"
    }
  }
  ```

#### Analyze
- **POST `/api/stl/analyze`** - Analyze STL file properties
  ```json
  Body: { fileBuffer: "base64-encoded-stl" }
  Response: {
    success: true,
    analysis: {
      boundingBox: {
        widthMm: 100.50,
        heightMm: 80.25,
        depthMm: 60.75
      },
      volume: {
        mm3: 513000.00,
        cm3: 513.00
      },
      material: {
        plaWeightGrams: 636.12,
        estimatedCostINR: 1590.30
      },
      printing: {
        estimatedPrintTimeHours: 12.50,
        estimatedPrintTimeMinutes: 750,
        estimatedSupportWastePercentage: 10,
        supportWeightGrams: 63.61
      },
      metadata: {
        fileFormat: "Binary",
        facetCount: 4520
      }
    }
  }
  ```

#### Price Calculation
- **POST `/api/stl/price`** - Calculate printing price
  ```json
  Body: {
    grams: 636.12,
    userType: "student"  // "student" | "faculty" | "guest"
  }
  Response: {
    success: true,
    costRupees: 1590,
    breakdown: {
      grams: 636.12,
      userType: "student",
      costPerGram: 2.50,
      materialCost: 1590.30,
      supportMaterialCost: 159.03,
      serviceCharge: 87.46,
      subtotal: 1836.79,
      discountPercentage: 0,
      discountAmount: 0.00,
      finalCost: 1836.79
    }
  }
  ```

### PCB Builder

#### Options
- **GET `/api/pcb/builder`** - Get available PCB options
  ```json
  Response: {
    success: true,
    options: {
      colors: [...],
      copperThickness: [...],
      layerCount: [...],
      drillSizes: [...],
      surfaceFinish: [...],
      silkscreen: [...],
      minimumValues: {...},
      maxValues: {...}
    }
  }
  ```

#### Build
- **POST `/api/pcb/builder`** - Create PCB specification
  ```json
  Body: {
    width: 100,
    height: 80,
    thickness: 1.6,
    layerCount: 4,
    color: "green",
    copperThickness: "1oz",
    drillSizes: ["0.3mm", "0.4mm"],
    surfaceFinish: "hasl",
    silkscreen: { top: true, bottom: false }
  }
  Response: {
    success: true,
    specification: {...},
    calculations: {
      boardAreaCm2: 80.00,
      boardAreaMm2: 8000.00,
      copperUsageGrams: 2.86,
      estimatedPriceINR: 18000,
      priceBreakdown: {
        basePrice: 18000.00,
        sgst: 1620.00,
        cgst: 1620.00,
        totalWithGST: 21240.00
      }
    },
    gerberMetadata: {...}
  }
  ```

### User Session Management

#### Create Session
- **POST `/api/user/session`** - Create JWT session
  ```json
  Body: {
    id: "user-id",
    email: "user@example.com",
    name: "John Doe",
    picture: "https://...",
    provider: "google"
  }
  Response: {
    success: true,
    token: "jwt-token",
    user: {...}
  }
  ```

#### Verify Session
- **GET `/api/user/session`** - Verify current session
  ```
  Header: Authorization: Bearer <jwt-token>
  Response: {
    success: true,
    user: {...}
  }
  ```

#### Logout
- **DELETE `/api/user/session`** - Invalidate session
  ```
  Header: Authorization: Bearer <jwt-token>
  Response: {
    success: true,
    message: "Session invalidated..."
  }
  ```

## Pricing Tiers

### 3D Printing (STL)
- **Student**: ₹2.50 per gram
- **Faculty**: ₹2.00 per gram (20% discount)
- **Guest**: ₹3.50 per gram

Plus:
- Support material waste: 10% additional
- Service charge: 5%

### PCB Fabrication
Base: ₹15 per cm² with multipliers:
- Color: 1.0x - 1.25x (Black most expensive)
- Copper: 1.0x - 1.6x (1oz - 3oz)
- Layers: 1.0x - 6.0x (2-layer to 8-layer)
- Surface finish: 1.0x - 1.5x (HASL to ENIG)

Plus 18% GST (9% SGST + 9% CGST)

## Installation & Setup

### 1. Install Dependencies

```bash
# Core dependencies
npm install jsonwebtoken form-data multer @vercel/node cross-fetch googleapis

# Development dependencies
npm install --save-dev @types/jsonwebtoken @types/multer @types/node @types/express
```

### 2. Add npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "vercel-build": "npm run build"
  }
}
```

### 3. Configure Environment Variables

For local development:
```bash
# Create .env.local
JWT_SECRET=dev-secret-key-min-32-characters
GOOGLE_CLIENT_ID=your-dev-client-id
GOOGLE_CLIENT_SECRET=your-dev-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
MICROSOFT_CLIENT_ID=your-dev-client-id
MICROSOFT_CLIENT_SECRET=your-dev-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback
```

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add complete backend API"
git push origin main
```

### Step 2: Create Vercel Project

1. Visit https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Select the root directory (automatic detection)
5. Click "Deploy"

### Step 3: Set Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.local`:
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (use production domain)
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `MICROSOFT_REDIRECT_URI` (use production domain)

### Step 4: Update OAuth Redirect URIs

**Google Console** (https://console.cloud.google.com/):
- Authorized redirect URIs: `https://yourdomain.vercel.app/api/auth/google/callback`

**Microsoft Entra ID** (https://entra.microsoft.com/):
- Web > Redirect URIs: `https://yourdomain.vercel.app/api/auth/microsoft/callback`

### Step 5: Deploy

Deployment is automatic after pushing to GitHub.

## Testing Endpoints

### Using cURL

```bash
# Create session
curl -X POST http://localhost:3000/api/user/session \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user-123",
    "email": "test@example.com",
    "name": "Test User",
    "provider": "google"
  }'

# Verify session
curl -X GET http://localhost:3000/api/user/session \
  -H "Authorization: Bearer <jwt-token>"

# Calculate price
curl -X POST http://localhost:3000/api/stl/price \
  -H "Content-Type: application/json" \
  -d '{
    "grams": 100,
    "userType": "student"
  }'

# Get PCB options
curl http://localhost:3000/api/pcb/builder

# Build PCB
curl -X POST http://localhost:3000/api/pcb/builder \
  -H "Content-Type: application/json" \
  -d '{
    "width": 100,
    "height": 80,
    "layerCount": 4,
    "color": "green",
    "copperThickness": "1oz"
  }'
```

## Frontend Integration Example

```typescript
// Example: Authenticate with Google
async function loginWithGoogle() {
  // Step 1: Get Google login URL
  const urlResponse = await fetch('/api/auth/google');
  const { url } = await urlResponse.json();
  
  // Step 2: Redirect to Google
  window.location.href = url;
}

// Example: Verify session on app load
async function verifySession(token: string) {
  const response = await fetch('/api/user/session', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await response.json();
}

// Example: Calculate 3D printing price
async function calculatePrice(grams: number, userType: string) {
  const response = await fetch('/api/stl/price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grams, userType })
  });
  return await response.json();
}

// Example: Upload and analyze STL
async function uploadAndAnalyzeSTL(file: File) {
  // Upload
  const uploadForm = new FormData();
  uploadForm.append('file', file);
  const uploadRes = await fetch('/api/stl/upload', {
    method: 'POST',
    body: uploadForm
  });
  const { fileReference } = await uploadRes.json();
  
  // Analyze
  const analysisRes = await fetch('/api/stl/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBuffer: fileReference.buffer })
  });
  return await analysisRes.json();
}
```

## Security Notes

1. **JWT Secret**: Use a strong, random secret (min 32 characters)
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS for your specific domain in production
4. **Environment Variables**: Never commit `.env.local` to git
5. **Rate Limiting**: Implement rate limiting in production (use Vercel Analytics)
6. **Input Validation**: All endpoints validate inputs
7. **Token Expiration**: Tokens expire in 30 days

## Troubleshooting

### Google OAuth Not Working
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check redirect URI matches in Google Console
- Ensure domain is verified in Google Console

### Microsoft OAuth Not Working
- Verify `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` are correct
- Check redirect URI in Entra ID matches
- Ensure application is configured for Web app type

### STL Analysis Failing
- Verify file is valid binary or ASCII STL format
- Check file size is not too large (Vercel timeout: 30s for hobby plan)
- Ensure file buffer is properly base64 encoded

### Session Verification Failing
- Check JWT_SECRET is set and consistent
- Verify token is not expired
- Ensure Authorization header format is: `Bearer <token>`

## Support

For issues or questions:
1. Check the API documentation above
2. Review error messages in response
3. Check Vercel logs: `vercel logs <project-name>`
4. Verify all environment variables are set correctly

---

**Last Updated**: December 9, 2025
**Backend Version**: 1.0
**Vercel Node Runtime**: 18.x
