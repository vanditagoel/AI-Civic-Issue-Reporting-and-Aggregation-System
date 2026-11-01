# External Setup & Production Deployment Manual

This guide contains the step-by-step external setup checklist for hosting CivicLens with a managed PostgreSQL database, Google Gemini AI API, Render backend deployment, and Vercel frontend.

---

## 1. Obtain Google Gemini API Key

1. Navigate to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Create API Key"** and select or create a Google Cloud Project.
4. Copy the generated key (starts with `AIzaSy...`).
5. **CRITICAL SECURITY RULE:** Store this key **only** in the Django backend environment variable:
   ```env
   GEMINI_API_KEY=AIzaSyYourGeneratedSecretKeyHere
   ```
   *Never expose this key in the frontend repository or Next.js public environment variables.*

---

## 2. Provision Hosted PostgreSQL Database (Neon or Render)

### Option A: Neon Serverless PostgreSQL (Recommended)
1. Go to [neon.tech](https://neon.tech/) and create a free account.
2. Click **Create Project**, name it `civiclens-production`.
3. In the Neon Console dashboard, locate the **Connection Details** box.
4. Select **PostgreSQL 16** and ensure connection string mode is set to **Pooled connection**.
5. Copy the connection string. It will look like:
   ```text
   postgresql://civiclens_owner:npg_xY1z8AbCd@ep-sparkling-wave-123456.us-east-2.aws.neon.tech/civiclens_production?sslmode=require
   ```
6. **SSL Mode Requirement:** Neon requires `sslmode=require`. Ensure this query parameter is present in `DATABASE_URL`.

---

## 3. Deploy Django REST Framework Backend to Render

1. Go to [render.com](https://render.com/) and click **New + > Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name:** `civiclens-backend`
   - **Region:** Ohio (US East) or Frankfurt (match your Neon DB region)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command:**
     ```bash
     gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3
     ```
4. **Pre-Deploy Release Step (Automated Migrations):**
   - Under Settings > **Pre-Deploy Command**, enter:
     ```bash
     python manage.py migrate
     ```
5. **Environment Variables:**
   Under the **Environment** tab on Render, add:
   | Key | Value |
   | :--- | :--- |
   | `PYTHON_VERSION` | `3.12.2` |
   | `DATABASE_URL` | `postgresql://civiclens_owner:pass@ep-xyz.neon.tech/civiclens_production?sslmode=require` |
   | `SECRET_KEY` | *(Generate a random 50-character string)* |
   | `DEBUG` | `False` |
   | `ALLOWED_HOSTS` | `civiclens-backend.onrender.com,localhost` |
   | `CORS_ALLOWED_ORIGINS` | `https://civiclens.vercel.app` |
   | `CSRF_TRUSTED_ORIGINS` | `https://civiclens.vercel.app` |
   | `GEMINI_API_KEY` | `AIzaSy...` |
   | `GEMINI_MODEL` | `gemini-2.5-flash` |
   | `JOB_RUNNER` | `inline` *(or deploy a separate Render Background Worker running `python manage.py run_worker`)* |
6. Click **Create Web Service**.
7. Once deployed, open the Render **Shell** tab and run initial demo data seeding:
   ```bash
   python manage.py seed_demo
   ```

---

## 4. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com/) and click **Add New > Project**.
2. Import your CivicLens Git repository.
3. In Project Settings:
   - **Framework Preset:** Next.js (or Vite if deployed as static SPA)
   - **Root Directory:** `./`
4. In **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://civiclens-backend.onrender.com/api
   ```
5. **Rewrites / Reverse Proxy Setup (To Prevent Cross-Origin Cookie Issues):**
   If using Next.js App Router, ensure `next.config.ts` includes rewrites:
   ```typescript
   async rewrites() {
     return [
       {
         source: '/api/:path*',
         destination: 'https://civiclens-backend.onrender.com/api/:path*',
       },
     ];
   }
   ```
6. Click **Deploy**. Note your live frontend URL (e.g. `https://civiclens.vercel.app`).

---

## 5. Update Allowed Origins on Render Backend

Once your Vercel URL is known:
1. Return to Render > `civiclens-backend` > **Environment**.
2. Update:
   - `CORS_ALLOWED_ORIGINS`: `https://civiclens.vercel.app`
   - `CSRF_TRUSTED_ORIGINS`: `https://civiclens.vercel.app`
   - `ALLOWED_HOSTS`: `civiclens-backend.onrender.com`
3. Click **Save Changes** (Render will automatically redeploy).

---

## 6. Post-Deployment Verification Checklist

- [ ] **Step 1: Check Database Connectivity**
  Visit: `https://civiclens-backend.onrender.com/api/health/`
  *Must return HTTP 200 with `{"status":"healthy","database":"postgresql"}`.*
- [ ] **Step 2: Inspect OpenAPI Documentation**
  Visit: `https://civiclens-backend.onrender.com/api/docs/`
  *Verify Swagger UI renders with all endpoints.*
- [ ] **Step 3: Test Citizen Authentication**
  Open frontend `https://civiclens.vercel.app`. Log in as `goelvandita777@gmail.com` / `citizen2026`.
- [ ] **Step 4: Submit a Civic Report**
  File a new community notice (e.g. "Severe pothole at Hospital Gate 4").
- [ ] **Step 5: Verify AI Agent Execution**
  Watch the processing job status transition to `SUCCEEDED`. Inspect generated priority score and tier.
- [ ] **Step 6: Test Officer Operations Console**
  Log in as `admin.dispatch@civiclens.gov` / `director2026`. Open Operations Desk, test work order status update and department reassignment.

---

## 7. Common Deployment Failures & Quick Fixes

| Failure Symptom | Underlying Cause | Quick Fix |
| :--- | :--- | :--- |
| `psycopg.OperationalError: SSL connection error` | Missing SSL query parameter | Append `?sslmode=require` to your `DATABASE_URL`. |
| `CSRF Failed: Origin checking failed` | Missing origin in CSRF whitelist | Ensure `CSRF_TRUSTED_ORIGINS` includes exact frontend URL with scheme (e.g. `https://civiclens.vercel.app`). |
| 500 error on static assets | WhiteNoise not enabled | Verify `whitenoise.middleware.WhiteNoiseMiddleware` is in `MIDDLEWARE` right after `SecurityMiddleware`. |
| Long delay (30-50s) on first request | Render Free Tier cold start | Normal behavior on free tier spindown. Upgrade to Starter tier ($7/mo) or use a heartbeat ping service like UptimeRobot on `/api/health/`. |
| `DisallowedHost at /` | Host header mismatch | Add your custom domain to `ALLOWED_HOSTS` on Render. |
