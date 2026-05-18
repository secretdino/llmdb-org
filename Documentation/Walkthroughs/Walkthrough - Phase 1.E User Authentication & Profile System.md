# Walkthrough - Phase 1.E User Authentication & Profile System

## Executive Summary

To transition the community portal into a production-ready, interactive ecosystem, we have implemented a high-performance, secure **User Authentication & Profile System** using [NextAuth.js](https://next-auth.js.org/). 

This system integrates a dual-tier strategy:
1. **Developer In-Memory Seed Auth**: Provides local zero-config sandbox tests using hashed passwords via `bcryptjs`.
2. **Production GitHub OAuth**: Automatically provisions community profiles directly into the database on first login.

All page routes, state changes, upvote forms, and submission modules are securely guarded. When unauthenticated users attempt restricted actions, they are dynamically redirected with correct callback-returning parameters.

---

## 🛠️ Architecture & Technical Design

### 1. Database Schema Extension
We extended the existing `users` table inside [schema.ts](file:///c:/git/pi/llmdb/src/db/schema.ts) to support password storage and OAuth accounts:
* Added a `passwordHash` column (`text`) to store salted, hashed developer credentials.
* Added a `githubId` column (`varchar(255)`) to bind and link production OAuth accounts.

### 2. NextAuth Engine & JWT Setup
Implemented a dynamic serverless auth router at [route.ts](file:///c:/git/pi/llmdb/src/app/api/auth/%5B...nextauth%5D/route.ts) configured with:
* **JWT Session Strategy**: Scalable session tracking requiring no persistent database lookups for API actions.
* **Credentials Provider**: Custom DB query hooks validating hashes via `bcrypt.compare`.
* **GitHub OAuth Provider**: Custom sign-in callback checking email records. Auto-inserts a new profile if the user does not exist, or hydrates missing OAuth keys on match.
* **Session Mapping Callbacks**: Hydrates user IDs, custom display names, and roles (`admin`/`user`) directly into the encrypted JWT token.

### 3. Glassmorphic User Interface Portal
Crafted an immersive, premium user login terminal at [page.tsx (login)](file:///c:/git/pi/llmdb/src/app/login/page.tsx) featuring:
* Interactive tabs to toggle between credentials and OAuth.
* Fully styled responsive error alert callouts with dynamic URL queries parsing.
* A custom, lightweight, type-safe inline SVG for the GitHub brand identity to guarantee compilation reliability.
* Complete Next.js `<Suspense>` wrapper isolation to resolve static prerendering search param bailouts.

### 4. Interactive Header Widget & Guards
Modified the landing dashboard [page.tsx](file:///c:/git/pi/llmdb/src/app/page.tsx) to support:
* **Sign In CTA**: A glowing glassmorphic trigger for anonymous guests.
* **Avatar Dropdown**: An elegant dropdown card revealing the authenticated user's name, email, dynamic `ADMIN`/`USER` role badge, and a secure `Sign Out` action.
* **Timing Log Submission Guard**: Redirects unauthenticated URL requests immediately to `/login?callbackUrl=/submit`.
* **Upvoting Guard**: Secures community rating points by redirecting to login with active page context when clicking upvote.

---

## 📦 Files Created & Modified

### 1. New Core Auth Modules
* **[route.ts](file:///c:/git/pi/llmdb/src/app/api/auth/%5B...nextauth%5D/route.ts)**: NextAuth.js router controller handling credentials verify and OAuth insertions.
* **[session-provider.tsx](file:///c:/git/pi/llmdb/src/components/session-provider.tsx)**: React client wrapper supplying auth context hydration.

### 2. Upgraded Pages & Components
* **[layout.tsx](file:///c:/git/pi/llmdb/src/app/layout.tsx)**: Wrapped the global layout tree inside the `<SessionProvider>`.
* **[schema.ts](file:///c:/git/pi/llmdb/src/db/schema.ts)**: Appended `passwordHash` and `githubId` columns.
* **[seed.ts](file:///c:/git/pi/llmdb/src/db/seed.ts)**: Salted and hashed local admin password (`adminpass` via `bcryptjs`).
* **[page.tsx](file:///c:/git/pi/llmdb/src/app/page.tsx)**: Appended the profile header dropdown menu and interactive action guards.
* **[page.tsx (login)](file:///c:/git/pi/llmdb/src/app/login/page.tsx)**: Beautiful interactive Cyberglass login form wrapped in a `<Suspense>` container.
* **[page.tsx (submit)](file:///c:/git/pi/llmdb/src/app/submit/page.tsx)**: Added a dynamic page-level authentication check and fallback loaders.

---

## 🧪 Verification & Production Build Validation

### 1. Compile Checks & Lint Verification
To guarantee absolute type-safety across all platforms, we executed:
```powershell
npx tsc --noEmit
```
* **Result**: `The command completed successfully.` (0 errors).

### 2. Static Page Optimization & Production Compilation
To verify the complete build pipeline:
```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/llmdb"; npm run build
```
* **Result**: `Exit code: 0` (Successfully optimized and exported all 9 paths).

```
Route (app)                              Size     First Load JS
┌ ○ /                                    10.2 kB         107 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ƒ /api/auth/[...nextauth]              0 B                0 B
├ ƒ /api/v1/benchmarks                   0 B                0 B
├ ƒ /api/v1/benchmarks/[id]              0 B                0 B
├ ƒ /api/v1/keys                         0 B                0 B
├ ƒ /api/v1/keys/[id]                    0 B                0 B
├ ○ /login                               4.36 kB         101 kB
└ ○ /submit                              8.69 kB         106 kB
+ First Load JS shared by all            87.3 kB
```

### 3. Local In-Memory Sandbox Test Values
For local verification without public OAuth credentials:
* **Test Email**: `admin@llmdb.org`
* **Test Password**: `adminpass`
* **Secure Database Role**: `admin`
