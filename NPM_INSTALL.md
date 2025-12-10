# NPM Installation Commands

## Complete Backend Setup

Copy and paste these commands into PowerShell to install all required dependencies:

### All-in-One Command (Recommended)

```powershell
npm install jsonwebtoken form-data multer @vercel/node cross-fetch googleapis && npm install --save-dev @types/jsonwebtoken @types/multer @types/node
```

### Step-by-Step Commands

If you prefer to install in separate steps:

```powershell
# Step 1: Install production dependencies
npm install jsonwebtoken form-data multer @vercel/node cross-fetch googleapis

# Step 2: Install development dependencies
npm install --save-dev @types/jsonwebtoken @types/multer @types/node

# Step 3: Verify installation
npm list jsonwebtoken @vercel/node
```

## What Each Package Does

### Production Dependencies

| Package | Purpose |
|---------|---------|
| `jsonwebtoken` | JWT token creation and verification for sessions |
| `@vercel/node` | TypeScript types for Vercel serverless functions |
| `cross-fetch` | HTTP client for Microsoft OAuth (works in Node.js) |
| `googleapis` | Google APIs client for OAuth2 |
| `form-data` | Handle multipart form data for file uploads |
| `multer` | Middleware for parsing file uploads |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| `@types/jsonwebtoken` | TypeScript definitions for jsonwebtoken |
| `@types/multer` | TypeScript definitions for multer |
| `@types/node` | TypeScript definitions for Node.js |

## Verify Installation

After running npm install, verify the packages are installed:

```powershell
# Check if packages are installed
npm list jsonwebtoken
npm list @vercel/node
npm list --save-dev @types/jsonwebtoken

# Should output: (empty) if all is well
npm outdated
```

## Expected Output

After successful installation, you should see:

```
added 47 packages, and audited 200 packages in 2m
found 0 vulnerabilities
```

## What Gets Updated in package.json

Your `package.json` will be updated with:

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "form-data": "^4.0.0",
    "multer": "^1.4.5",
    "@vercel/node": "^2.x.x",
    "cross-fetch": "^3.1.0",
    "googleapis": "^120.0.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.0",
    "@types/multer": "^1.4.7",
    "@types/node": "^18.0.0"
  }
}
```

## Troubleshooting Installation

### Error: "npm ERR! code ERESOLVE"

This usually means dependency conflicts. Try:

```powershell
npm install --legacy-peer-deps jsonwebtoken form-data multer @vercel/node cross-fetch googleapis
```

### Error: "Permission denied"

On Windows, run PowerShell as Administrator:

```powershell
# Right-click PowerShell and select "Run as administrator"
npm install jsonwebtoken form-data multer @vercel/node cross-fetch googleapis
```

### Error: "Module not found after install"

Clear npm cache and reinstall:

```powershell
npm cache clean --force
npm install
```

## Verify Backend Setup

After installation, verify the backend files exist:

```powershell
# Check backend structure
ls -Recurse api/

# Should show:
# api/auth/google.ts
# api/auth/microsoft.ts
# api/stl/upload.ts
# api/stl/analyze.ts
# api/stl/price.ts
# api/pcb/builder.ts
# api/pcb/options.json
# api/user/session.ts
```

## Build TypeScript

After installing dependencies, build the TypeScript:

```powershell
# Check TypeScript compilation
npm run build

# Or just check for errors without building
npm run type-check
```

## Verify Vercel Configuration

```powershell
# Check vercel.json exists and is valid JSON
cat vercel.json | ConvertFrom-Json

# Should output the configuration without errors
```

## Next: Environment Setup

After npm install is complete, proceed to create `.env.local`:

```powershell
# Copy template
cp .env.local.example .env.local

# Edit with your credentials
code .env.local
```

## Next: Local Testing

```powershell
# Start development server
npm run dev

# Backend will be available at http://localhost:3000/api/*
```

## Installation Verification Checklist

After running npm install:

- [ ] No error messages in console
- [ ] `node_modules` folder created
- [ ] `package-lock.json` updated
- [ ] All 6 production packages installed
- [ ] All 3 development packages installed
- [ ] TypeScript builds without errors
- [ ] Backend files exist in `api/` directory
- [ ] `vercel.json` is present

---

**You're ready to test the backend locally!**

Run: `npm run dev`

Then test an endpoint: `http://localhost:3000/api/pcb/builder`

