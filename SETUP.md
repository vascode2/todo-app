# TaskFlow — Setup & Deployment Guide

## Prerequisites
- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials
- A Railway account (free tier ok)
- A Vercel account (free tier ok)

---

## Step 1 — Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Select your project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (dev)
   - `https://your-vercel-app.vercel.app` (prod — add after deploying)
6. Add Authorized redirect URIs:
   - `http://localhost:4000/auth/google/callback` (dev — not used but required)
   - `https://your-railway-app.up.railway.app/auth/google/callback` (prod)
7. Copy the **Client ID** and **Client Secret**

---

## Step 2 — Local Development

### Backend
```bash
cd todoapp/backend
cp .env.example .env
# Fill in .env with your values
npm install
npm run db:generate
npm run db:push       # creates tables (use this for local dev)
npm run dev           # starts on http://localhost:4000
```

`.env` values:
```
DATABASE_URL="postgresql://user:password@localhost:5432/todoapp"
GOOGLE_CLIENT_ID=<from step 1>
GOOGLE_CLIENT_SECRET=<from step 1>
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
JWT_SECRET=<any long random string, e.g. run: openssl rand -base64 32>
CLIENT_URL=http://localhost:5173
PORT=4000
```

### Frontend
```bash
cd todoapp/frontend
cp .env.example .env
# Fill in .env
npm install
npm run dev           # starts on http://localhost:5173
```

`.env` values:
```
VITE_GOOGLE_CLIENT_ID=<same Client ID from step 1>
VITE_API_URL=           # leave empty — vite proxy handles it in dev
```

---

## Step 3 — Deploy Backend to Railway

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**
2. Select the repo, set **Root Directory** to `todoapp/backend`
3. Add a **PostgreSQL** service to the same project (Railway provides it free)
4. In the backend service **Variables**, add:
   ```
   DATABASE_URL          → (Railway auto-fills this from the Postgres service)
   GOOGLE_CLIENT_ID      → your value
   GOOGLE_CLIENT_SECRET  → your value
   JWT_SECRET            → your value
   CLIENT_URL            → https://your-vercel-app.vercel.app
   PORT                  → 4000
   ```
5. Deploy. Copy the Railway public URL (e.g. `https://todoapp-backend.up.railway.app`)

---

## Step 4 — Deploy Frontend to Vercel

1. Go to https://vercel.com → **New Project** → Import repo
2. Set **Root Directory** to `todoapp/frontend`
3. Set **Framework Preset** to **Vite**
4. Add **Environment Variables**:
   ```
   VITE_GOOGLE_CLIENT_ID  → your value
   VITE_API_URL           → https://your-railway-backend-url.up.railway.app
   ```
5. Deploy. Copy the Vercel URL.

---

## Step 5 — Update Google OAuth with production URLs

Go back to Google Cloud Console → Credentials → your OAuth client:
- Add Authorized JavaScript origins: `https://your-vercel-app.vercel.app`
- Add Authorized redirect URIs: `https://your-railway-app.up.railway.app/auth/google/callback`

Also update Railway env var `CLIENT_URL` → `https://your-vercel-app.vercel.app`

---

## Done!

Open `https://your-vercel-app.vercel.app` on any device.
Sign in with Google and start using TaskFlow.
