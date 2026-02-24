# Firebase → Railway Migration TODO (Do this BEFORE coding changes)

This is the exact checklist for migrating **NTSA Test Theory / DriveTheory CBT** from **Firebase** to **Railway + Postgres**.

## A. Architecture decisions (lock these first)
1. ✅ Confirm auth approach
   - **MVP**: Email + password + JWT (implemented)
   - Later: phone OTP (Africa-friendly), social login, etc.
2. ✅ Confirm payment flows you will keep
   - M-PESA STK Push (Daraja)
   - Paystack card payments (optional)
3. ✅ Confirm plans + pricing
   - weekly / monthly / yearly (amounts in KES) — set in backend config

## B. Data model + migration plan
4. Map old Firestore collections → Postgres tables
   - `users` → `User`
   - `subscriptions` → `Subscription`
   - `payments` → `Payment`
5. Decide what to do with existing Firebase users
   - Option 1 (fastest): ask users to **re-register** in the new system
   - Option 2 (better): export Firebase Auth users and run a **one-time migration** (requires password reset flow)
6. Export Firestore data (if you need continuity)
   - export `subscriptions` and `payments` for historical records

## C. Backend replacement tasks (Railway)
7. Create new backend service (`backend/railway`)
8. Provision Railway Postgres and set env vars
9. Run Prisma migrations on Railway
10. Configure public callback URL for Daraja:
    - `BASE_URL_PUBLIC=https://<railway-domain>`
    - `DARAJA_CALLBACK_PATH=/api/payments/mpesa/callback`
11. (Production) Add callback allowlist / verification strategy

## D. Android app replacement tasks
12. Remove Firebase SDK usage:
    - delete Firebase DI module
    - replace Auth/Profile/Subscriptions with REST API calls
13. Update Billing + M-PESA client calls to use JWT auth
14. Update BuildConfig `BACKEND_BASE_URL` to Railway URL
15. QA test flows:
    - Register / Login / Logout
    - Profile edit
    - M-PESA STK push payment
    - Entitlements check + premium unlock
    - Paystack (if enabled)
16. Release plan
    - staged rollout (internal test → closed test → production)

## E. Security + compliance tasks
17. Store JWT in EncryptedPrefs (done) + ensure logout clears
18. Rate-limit auth endpoints (Railway/express middleware or reverse proxy)
19. Secure payment webhooks (signature + allowlist)
20. Add audit logs for payments + entitlement grants

## F. Documentation tasks
21. Rewrite root README for Railway architecture
22. Add deployment guide (Railway)
23. Add PRD for product + migration (this doc set)
