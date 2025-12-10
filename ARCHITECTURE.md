# 📊 BACKEND ARCHITECTURE OVERVIEW

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)                │
│                     (Not Modified - Unchanged)                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Requests
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  VERCEL SERVERLESS PLATFORM                     │
│                      (Node.js 18.x Runtime)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API ROUTER                            │  │
│  │              /api/(.*)  → /api/$1                        │  │
│  └──────┬───────────────────────────────────────────────────┘  │
│         │                                                       │
│    ┌────┴────┬──────────┬──────────┬──────────┐               │
│    ↓         ↓          ↓          ↓          ↓               │
│ ┌──────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌──────────┐         │
│ │ AUTH │ │  STL   │ │  PCB   │ │ USER │ │ EXTERNAL │         │
│ │      │ │        │ │        │ │      │ │  APIs    │         │
│ └──────┘ └────────┘ └────────┘ └──────┘ └──────────┘         │
│    │         │          │         │          │               │
└────┼─────────┼──────────┼─────────┼──────────┼───────────────┘
     │         │          │         │          │
     ↓         ↓          ↓         ↓          ↓
  Google   OAuth2 +    JSON       JWT      Google API
Microsoft    File      Config    Manager   Microsoft API
  Entra ID Processing            Create
           Analysis  Options     Verify
          Pricing    Builder
```

---

## API Endpoints Map

```
/api/
├── /auth/
│   ├── /google
│   │   ├── GET  → Return Google login URL
│   │   └── POST → Handle OAuth callback
│   │
│   └── /microsoft
│       ├── GET  → Return Microsoft login URL
│       └── POST → Handle OAuth callback
│
├── /stl/
│   ├── /upload
│   │   └── POST → Upload STL file → { fileReference }
│   │
│   ├── /analyze
│   │   └── POST → Analyze STL → { analysis }
│   │
│   └── /price
│       └── POST → Calculate price → { costRupees }
│
├── /pcb/
│   ├── GET  /builder → Get options → { options }
│   └── POST /builder → Build PCB → { specification }
│
└── /user/
    └── /session
        ├── POST   → Create JWT → { token }
        ├── GET    → Verify JWT → { user }
        └── DELETE → Logout → { message }
```

---

## Data Flow Examples

### Authentication Flow

```
User clicks "Sign in with Google"
           ↓
Frontend calls GET /api/auth/google
           ↓
Backend returns Google login URL
           ↓
Frontend redirects to Google
           ↓
User authorizes app
           ↓
Google redirects back with code
           ↓
Frontend calls POST /api/auth/google { code }
           ↓
Backend exchanges code for access token
           ↓
Backend fetches user profile from Google
           ↓
Backend generates JWT token
           ↓
Frontend receives { token, user }
           ↓
Frontend stores token in localStorage
           ↓
User is authenticated ✓
```

### 3D Printing Price Calculation Flow

```
User selects 3D model (STL file)
           ↓
Frontend calls POST /api/stl/upload (file)
           ↓
Backend receives file, validates STL format
           ↓
Backend returns { fileReference }
           ↓
Frontend calls POST /api/stl/analyze { fileBuffer }
           ↓
Backend parses STL (binary or ASCII)
           ↓
Backend calculates:
  - Bounding box dimensions
  - Volume (divergence theorem)
  - Weight (PLA density × volume)
  - Print time (speed-based estimation)
  - Support material waste
           ↓
Backend returns { analysis }
           ↓
Frontend displays analysis results
           ↓
User selects user type (student/faculty/guest)
           ↓
Frontend calls POST /api/stl/price { grams, userType }
           ↓
Backend calculates tiered price:
  - Material cost = grams × price_per_gram
  - Support cost = +10%
  - Service charge = +5%
  - Discount applied if faculty
           ↓
Backend returns { costRupees, breakdown }
           ↓
Frontend displays final price ✓
```

### PCB Builder Flow

```
User opens PCB Builder
           ↓
Frontend calls GET /api/pcb/builder
           ↓
Backend returns all available options:
  - Colors (6)
  - Copper thickness (3)
  - Layer count (4)
  - Drill sizes (5)
  - Surface finish (4)
           ↓
Frontend populates dropdown menus
           ↓
User selects specifications
           ↓
Frontend calls POST /api/pcb/builder { spec }
           ↓
Backend validates against options.json
           ↓
Backend calculates:
  - Board area in cm²
  - Copper usage in grams
  - Price with multipliers
  - GST (18%)
  - Gerber metadata
           ↓
Backend returns { specification, calculations }
           ↓
Frontend displays PCB quote ✓
```

---

## File Dependency Graph

```
index.ts (Entry point)
    ├── api/
    │   ├── auth/
    │   │   ├── google.ts
    │   │   │   ├── jsonwebtoken
    │   │   │   ├── googleapis
    │   │   │   └── @vercel/node
    │   │   │
    │   │   └── microsoft.ts
    │   │       ├── jsonwebtoken
    │   │       ├── cross-fetch
    │   │       └── @vercel/node
    │   │
    │   ├── stl/
    │   │   ├── upload.ts
    │   │   │   ├── multer
    │   │   │   └── @vercel/node
    │   │   │
    │   │   ├── analyze.ts
    │   │   │   ├── Custom STL parser
    │   │   │   └── @vercel/node
    │   │   │
    │   │   └── price.ts
    │   │       └── @vercel/node
    │   │
    │   ├── pcb/
    │   │   ├── builder.ts
    │   │   │   ├── options.json
    │   │   │   └── @vercel/node
    │   │   │
    │   │   └── options.json
    │   │
    │   └── user/
    │       └── session.ts
    │           ├── jsonwebtoken
    │           └── @vercel/node
    │
    ├── vercel.json
    └── .env (runtime)
        ├── JWT_SECRET
        ├── GOOGLE_*
        └── MICROSOFT_*
```

---

## Technology Stack Visualization

```
┌─────────────────────────────────────────────┐
│        Frontend (React + TypeScript)        │
│          (Not part of backend)              │
└─────────────────────┬───────────────────────┘
                      │
          ┌───────────┴───────────┐
          │ HTTP REST API         │
          │ JSON over HTTPS       │
          │ Bearer JWT Auth       │
          └───────────┬───────────┘
                      ↓
    ┌─────────────────────────────────┐
    │   Vercel Serverless Functions   │
    │       (Node.js 18.x)            │
    └─────────────────────────────────┘
          │                   │
    ┌─────┴──────┐    ┌──────┴──────┐
    │ TypeScript │    │ Middleware  │
    │ ESM Modules│    │  Support    │
    │   CORS     │    │ Error Hdlng │
    └─────┬──────┘    └──────┬──────┘
          │                  │
    ┌─────┴──────────────────┴────────┐
    │   Node.js Built-in Modules      │
    │  - fs, path, buffer, crypto     │
    └─────────────────────────────────┘
          │              │
    ┌─────┴──────┐ ┌────┴────────────┐
    │   External │ │  Google Cloud   │
    │  NPM Libs  │ │  Microsoft      │
    │            │ │  Entra ID       │
    │ - jwt      │ └────────────────┘
    │ - multer   │
    │ - fetch    │
    └────────────┘
```

---

## Security Layers

```
┌────────────────────────────────────────────────────┐
│            HTTPS/TLS Layer                         │
│    (Vercel automatic, required in production)      │
└────────────────┬─────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│         CORS Headers                               │
│   (Access-Control-Allow-Origin, Methods, Headers)  │
└────────────────┬─────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│       Input Validation Layer                       │
│  (All parameters validated, type-checked)          │
└────────────────┬─────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│      Authentication Layer                          │
│  (OAuth2 tokens, JWT verification)                 │
└────────────────┬─────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│    Authorization Layer                             │
│  (Token validation, user context)                  │
└────────────────┬─────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│    Business Logic Layer                            │
│  (Price calc, STL parsing, PCB validation)         │
└────────────────┬─────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│   Environment Variables                            │
│  (Secrets never in code, only in env)              │
└────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌──────────────────────────────┐
│    Developer's Machine       │
│  - Local development         │
│  - npm run dev               │
│  - Test endpoints            │
└──────────────┬───────────────┘
               │ git push
               ↓
┌──────────────────────────────┐
│    GitHub Repository         │
│  - Source code               │
│  - Backend & frontend        │
│  - Webhooks enabled          │
└──────────────┬───────────────┘
               │ Auto-trigger
               ↓
┌──────────────────────────────┐
│    Vercel Build System       │
│  - Install dependencies      │
│  - Build TypeScript          │
│  - Generate functions        │
└──────────────┬───────────────┘
               │ Deploy
               ↓
┌──────────────────────────────┐
│    Vercel Edge Network       │
│  - Global distribution       │
│  - Auto-scaling              │
│  - HTTPS/TLS                 │
└──────────────┬───────────────┘
               │ Requests
               ↓
┌──────────────────────────────┐
│    Your API Endpoints        │
│  - /api/auth/*               │
│  - /api/stl/*                │
│  - /api/pcb/*                │
│  - /api/user/*               │
└──────────────────────────────┘
```

---

## State Management

```
┌────────────────────────────────────┐
│         Frontend State             │
│  - User token (localStorage)       │
│  - User profile (memory)           │
│  - UI state (React state)          │
└────────────────────────────────────┘
                 │
                 ↓ Sends token in header
         Authorization: Bearer <JWT>
                 │
                 ↓
┌────────────────────────────────────┐
│         Backend State              │
│  - Stateless (no session store)    │
│  - JWT token as state carrier      │
│  - Environment variables           │
└────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    ↓                        ↓
  JWT                    External
(Verified)                Services
  User                  - Google API
  Context               - Microsoft API
                        - No DB calls
```

---

## Error Handling Flow

```
Input Request
     │
     ↓
[Validate Format]
     │
     ├─→ Invalid? → 400 Bad Request
     │
     ↓
[Validate Content]
     │
     ├─→ Invalid? → 422 Unprocessable Entity
     │
     ↓
[Check Authentication]
     │
     ├─→ Missing? → 401 Unauthorized
     ├─→ Invalid? → 403 Forbidden
     │
     ↓
[Process Request]
     │
     ├─→ Error? → 500 Internal Server Error
     │
     ↓
[Success Response]
     │
     └─→ 200 OK with data
```

---

## Performance Characteristics

```
Endpoint Type          Typical Response Time
─────────────────────────────────────────
GET /api/auth/*        ~500ms (external API)
POST /api/auth/*       ~800ms (external API)
POST /api/stl/upload   ~1-2s (file processing)
POST /api/stl/analyze  ~500ms (CPU-bound)
POST /api/stl/price    ~50ms (calculation)
GET  /api/pcb/builder  ~10ms (config read)
POST /api/pcb/builder  ~50ms (validation)
GET  /api/user/session ~10ms (JWT verify)
POST /api/user/session ~10ms (JWT create)

Cold Start: ~5 seconds (Vercel)
Warm Start: <100ms
```

---

## Scalability Design

```
Single Vercel Function
        ↓
   Concurrent
   Requests
        ↓
Automatic Scaling
   (Vercel)
        ↓
Multiple Instances
   Worldwide
        ↓
Load Distribution
     (CDN)
        ↓
   Users see
  <100ms latency
  globally
```

---

## Integration Points

```
Your App ←→ Backend
         ↓
    Uses JWT in:
    - localStorage
    - Fetch headers
    - API calls

Backend ←→ OAuth Providers
        ├→ Google OAuth2 API
        ├→ Microsoft Graph API
        └→ Token exchange

Backend ←→ Client Storage
        (StateLESS)
        No database calls
        No file storage
        No external storage
```

---

This architecture provides:
✅ Scalability (serverless)
✅ Security (multi-layer)
✅ Performance (optimized)
✅ Reliability (stateless)
✅ Maintainability (modular)

---

**Architecture Version**: 1.0
**Design Pattern**: Serverless Microservices
**Deployment Model**: Vercel Edge Functions
**Status**: ✅ Production Ready
