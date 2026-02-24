# NTSA Test Theory / DriveTheory CBT

Offline-first Android app for randomized driving theory exams (Kotlin + Jetpack Compose + Room).

## What changed (Firebase removed)

This repo previously used **Firebase Auth + Firestore + Cloud Functions** for:
- Users + profiles
- Subscriptions / entitlements
- Payments (M-PESA Daraja callbacks, Paystack verify/webhooks)

It now uses:
- **Railway** for hosting
- **Express API + Postgres (Prisma)** in `backend/railway`
- **JWT auth** stored in EncryptedPrefs on Android

> The old Firebase functions are still present under `backend/functions` for reference, but are considered **deprecated**.

---

## Project layout

- `app/` — Android app
- `backend/railway/` — **new** backend (Express + Prisma + Postgres) for Railway
- `backend/functions/` — old Firebase Cloud Functions (deprecated)

---

## Local dev

### Android
- Requirements: Android Studio (JDK 17), Android SDK 34+
- Build: `./gradlew assembleDebug`

Set backend URL in `app/build.gradle.kts` / `BuildConfig.BACKEND_BASE_URL` (search for `BACKEND_BASE_URL`).

### Backend (local)
```bash
cd backend/railway
npm install
# set DATABASE_URL + JWT_SECRET + Daraja/Paystack env vars
npx prisma migrate dev --name init
npm run dev
```

---

## Deploy backend to Railway (recommended)

### 1) Create Railway project
- New Project → **Deploy from GitHub** (or “Empty project” + connect repo)
- Add **PostgreSQL** plugin

### 2) Set Railway environment variables (Service → Variables)
Required:
- `JWT_SECRET` (long random string)
- `BASE_URL_PUBLIC` (your Railway domain, e.g. `https://xxxxx.up.railway.app`)
- `PAYSTACK_SECRET`
- `DARAJA_ENV` (`sandbox` or `production`)
- `DARAJA_CONSUMER_KEY`
- `DARAJA_CONSUMER_SECRET`
- `DARAJA_SHORTCODE`
- `DARAJA_PASSKEY`

Optional:
- `DARAJA_CALLBACK_PATH` (default: `/api/payments/mpesa/callback`)
- `DARAJA_CALLBACK_ALLOWLIST` (comma-separated IPs)
- `ADMIN_EMAILS` (comma-separated)

Railway will provide:
- `DATABASE_URL`
- `PORT`

### 3) Run migrations on Railway
In Railway → Service → Deploy logs / shell:
```bash
cd backend/railway
npx prisma migrate deploy
```

### 4) Point Android app to Railway
Set:
- `BACKEND_BASE_URL = "https://xxxxx.up.railway.app/"`

---

## Key API endpoints (new backend)

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/reset-password` (MVP returns token; production should send email)

- User / Entitlements (JWT):
  - `GET /api/me/profile`
  - `PUT /api/me/profile`
  - `GET /api/me/entitlements`

- Payments:
  - `POST /api/payments/mpesa/stk-push`
  - `POST /api/payments/mpesa/callback` (Safaricom)
  - `POST /api/payments/mpesa/manual-receipt` (fallback)
  - `GET /api/payments/status?paymentId=...`
  - `POST /api/paystack/initialize`
  - `GET /api/paystack/verify?reference=...`

---

## Next steps

See: **`TODO_RAILWAY_MIGRATION.md`** for the migration checklist and remaining work.


## Django Backend (Firebase-free)

A Django REST backend is available at `backend/django_api/`.

- Local run + Railway deploy guide: `docs/DJANGO_SETUP_AND_RUN.md`
- Health check: `/health`
