# PhishGuard Beginner Deployment Guide

This guide is written for first-time deployment.

## 1. What To Deploy

Your project has 3 parts:

1. Frontend (React + Vite) in `frontend/`
2. Backend API (FastAPI + ML models) in `backend/`
3. Firebase (Auth + Firestore) already hosted by Google

Recommended hosting:

1. Frontend: Vercel
2. Backend: Render (Web Service)
3. Database/Auth: Firebase (already configured)

---

## 2. Accounts You Need

Create free accounts (if not already):

1. GitHub
2. Render
3. Vercel
4. Firebase Console

---

## 3. Pre-Deployment Checklist (Do This First)

From your project:

1. Make sure code is pushed to GitHub main branch.
2. Keep local secret files out of git (`frontend/.env` should stay ignored).
3. Confirm these files exist:
   - `backend/requirements.txt`
   - `backend/main.py`
   - `frontend/package.json`
   - `frontend/.env.example`

Important project note:

- `frontend/src/services/api.js` currently uses `http://localhost:8000`.
- For production, this must point to your deployed backend URL.

Use this change before production deploy:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

---

## 4. Deploy Backend First (Render)

### Step 4.1 - Create Render Web Service

1. Open Render Dashboard.
2. Click New + -> Web Service.
3. Connect your GitHub repo.
4. Configure:
   - Name: phishguard-backend
   - Root Directory: backend
   - Runtime: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`

### Step 4.2 - Add Backend Environment Variables

In Render -> Environment:

1. `HOST=0.0.0.0`
2. `PORT=10000` (Render usually injects PORT automatically; keeping explicit is okay)
3. `DEBUG=False`

Optional (recommended):

1. `PYTHONUNBUFFERED=1`

### Step 4.3 - Deploy and Test Backend

1. Click Deploy.
2. After deploy completes, open:
   - `https://your-backend-name.onrender.com/health`
3. You should see JSON health output.

Save this backend URL. You need it for frontend.

---

## 5. Deploy Frontend (Vercel)

### Step 5.1 - Import Project

1. Open Vercel Dashboard.
2. Click Add New -> Project.
3. Import GitHub repo.
4. Configure:
   - Framework: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Step 5.2 - Add Frontend Environment Variables

In Vercel -> Settings -> Environment Variables, add:

1. `VITE_FIREBASE_API_KEY`
2. `VITE_FIREBASE_AUTH_DOMAIN`
3. `VITE_FIREBASE_PROJECT_ID`
4. `VITE_FIREBASE_STORAGE_BUCKET`
5. `VITE_FIREBASE_MESSAGING_SENDER_ID`
6. `VITE_FIREBASE_APP_ID`
7. `VITE_FIREBASE_MEASUREMENT_ID`
8. `VITE_API_BASE_URL` = your Render backend URL

Example:

`VITE_API_BASE_URL=https://phishguard-backend.onrender.com`

### Step 5.3 - Handle React Router Refresh (Very Important)

Because your app uses BrowserRouter, deep-link refreshes can fail without rewrite.

Create `frontend/vercel.json` with:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Then redeploy frontend.

---

## 6. Firebase Production Setup

### Step 6.1 - Authorized Domains

In Firebase Console -> Authentication -> Settings -> Authorized domains:

Add your Vercel domain, for example:

1. `your-project.vercel.app`
2. your custom domain (if any)

### Step 6.2 - Firestore Rules

Use your project rules file and publish rules from Firebase Console.

---

## 7. Connect Frontend and Backend

After both services are deployed:

1. Confirm frontend env var `VITE_API_BASE_URL` points to Render backend.
2. Redeploy frontend (or trigger a new build).
3. Open deployed frontend and test:
   - Login
   - Email/SMS/URL analysis
   - Dashboard scan history

---

## 8. First Deployment Test Checklist

Run this in order:

1. Open backend `/health` endpoint.
2. Open frontend home page.
3. Create account / login.
4. Run one URL scan.
5. Confirm scan appears in dashboard history.
6. Test page refresh on private route (dashboard/profile).

---

## 9. Common Errors and Fixes

### Error: White screen

Possible causes:

1. Missing frontend env vars in Vercel
2. Firebase config invalid
3. Build failed

Fix:

1. Re-check all `VITE_` variables
2. Redeploy frontend

### Error: Connection failed to backend

Possible causes:

1. `VITE_API_BASE_URL` still localhost
2. Backend asleep/crashed on Render

Fix:

1. Set correct Render URL
2. Check Render logs

### Error: 404 when refreshing dashboard/profile

Cause:

1. Missing `vercel.json` rewrite for SPA

Fix:

1. Add `frontend/vercel.json` rewrite
2. Redeploy frontend

### Error: Firestore permission denied

Cause:

1. Rules not published

Fix:

1. Publish Firestore rules in Firebase

---

## 10. Security Notes Before Going Live

1. Never commit real `.env` files.
2. Rotate any secrets that were ever committed in git history.
3. Use `DEBUG=False` in production backend.
4. Restrict CORS to your frontend domain only.

---

## 11. Recommended Beginner Deployment Order

1. Deploy backend on Render
2. Test backend `/health`
3. Set frontend env vars (including backend URL)
4. Deploy frontend on Vercel
5. Configure Firebase authorized domains + Firestore rules
6. End-to-end test

If you follow this order, deployment is usually smooth.
