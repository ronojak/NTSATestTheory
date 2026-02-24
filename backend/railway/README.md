# NTSA Test Theory API (Railway)

This folder contains the **new** backend that replaces:

- Firebase Cloud Functions (`backend/functions`)
- Firestore collections: `users`, `subscriptions`, `payments`

It runs as a standard Express API backed by **Postgres** (via Prisma), and is designed to be deployed on **Railway**.

## Quick start (local)

1. Create a local Postgres DB and set `DATABASE_URL`
2. Install deps:

```bash
cd backend/railway
npm install
```

3. Generate Prisma client + apply migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run:

```bash
npm run dev
```

Health check: `GET http://localhost:8080/health`

## Required environment variables

- `DATABASE_URL` (Railway provides this automatically when you add Postgres)
- `JWT_SECRET` (set a long random string)
- `BASE_URL_PUBLIC` (public URL of your Railway service, e.g. `https://xxxxx.up.railway.app`)
- `DARAJA_ENV` (`sandbox` | `production`)
- `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`
- `DARAJA_SHORTCODE`, `DARAJA_PASSKEY`
- `DARAJA_CALLBACK_PATH` (optional, default: `/api/payments/mpesa/callback`)
- `DARAJA_CALLBACK_ALLOWLIST` (optional, comma-separated IPs allowed to call callback)
- `PAYSTACK_SECRET`

Optional:
- `ADMIN_EMAILS` comma-separated list of admin emails
- `PAYSTACK_CALLBACK_URL` if you want Paystack to redirect back somewhere

## API summary

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/reset-password` (MVP: returns token; production: email)

- User / Entitlements (JWT):
  - `GET /api/me/profile`
  - `PUT /api/me/profile`
  - `GET /api/me/entitlements`

- Payments:
  - `POST /api/payments/mpesa/stk-push`
  - `POST /api/payments/mpesa/callback`
  - `GET /api/payments/status?paymentId=...`
  - `POST /api/paystack/initialize`
  - `GET /api/paystack/verify?reference=...`