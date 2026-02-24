# Railway Deployment Guide (NTSA Test Theory API)

This guide deploys the **new** backend in `backend/railway/` to Railway and connects it to Postgres.

## 1) Create Railway project
1. Go to Railway → New Project
2. Choose **Deploy from GitHub** and pick this repo
3. When prompted for a root directory, set it to:

`backend/railway`

(If Railway doesn’t ask, set it in the service settings → “Root Directory”.)

## 2) Add Postgres
- In Railway → Add Plugin → **PostgreSQL**
- Railway will automatically provide `DATABASE_URL` to your services (you may need to link the plugin to the service).

## 3) Set environment variables
In the backend service → Variables:

### Required
- `JWT_SECRET` = long random string
- `BASE_URL_PUBLIC` = `https://<your-service>.up.railway.app`
- `PAYSTACK_SECRET` = your Paystack secret key
- `DARAJA_ENV` = `sandbox` or `production`
- `DARAJA_CONSUMER_KEY`
- `DARAJA_CONSUMER_SECRET`
- `DARAJA_SHORTCODE`
- `DARAJA_PASSKEY`

### Optional (recommended)
- `DARAJA_CALLBACK_PATH` = `/api/payments/mpesa/callback`
- `DARAJA_CALLBACK_ALLOWLIST` = comma-separated IPs (if you have a known allowlist)
- `ADMIN_EMAILS` = comma-separated admin emails
- `PAYSTACK_CALLBACK_URL` = optional redirect URL

## 4) Configure build & start commands
Railway should auto-detect Node.

- Build command (optional): `npm install`
- Start command: `npm start`

## 5) Run Prisma migrations (Railway)
Open Railway shell for the service and run:

```bash
npx prisma migrate deploy
```

If you prefer, you can also run migrations during build by adding a script, but the explicit command is safer.

## 6) Verify health
Open in browser:

`GET https://<your-service>.up.railway.app/health`

Expected:
```json
{ "ok": true }
```

## 7) Configure Daraja callback URL
Safaricom will call:

`https://<your-service>.up.railway.app/api/payments/mpesa/callback`

Make sure `BASE_URL_PUBLIC` exactly matches your Railway domain.

## 8) Update Android app
Set `BACKEND_BASE_URL` to:

`https://<your-service>.up.railway.app/`

Rebuild and test:
- register/login
- STK push
- entitlement unlock

---

## Troubleshooting
- 500 errors → check missing env vars (`JWT_SECRET`, `BASE_URL_PUBLIC`, Daraja keys)
- No callback updates → verify callback URL + Railway public domain
- Prisma errors → ensure Postgres plugin is attached and `DATABASE_URL` exists
