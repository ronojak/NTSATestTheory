# PRD — NTSA Test Theory (Firebase → Railway) + Subscription Payments

## 1. Overview

### 1.1 Product summary
**NTSA Test Theory / DriveTheory CBT** is an offline-first Android app that helps learners prepare for driving theory exams through randomized MCQ practice tests, timed exams, scoring, and history tracking.

This PRD covers:
- Replacing Firebase (Auth + Firestore + Cloud Functions) with a **Railway-hosted backend**
- Introducing a clean, maintainable architecture for:
  - Authentication
  - User profiles
  - Subscription entitlements
  - Payments (M-PESA Daraja STK push + optional Paystack)

### 1.2 Why we are doing this
Firebase is convenient but can become limiting when:
- You need predictable costs and a standard backend stack
- You want Postgres relational integrity for payments/subscriptions
- You need a portable deployment target (Railway/VPS)
- You want easier local development + CI

### 1.3 Goals
- Remove runtime dependence on Firebase SDKs (Android) and Firebase services (backend)
- Deploy backend on Railway with Postgres and environment-variable configuration
- Maintain the same user experience:
  - login/register
  - purchase subscription via M-PESA
  - premium access unlocked via entitlement checks

### 1.4 Non-goals (for MVP)
- Full email delivery for password resets (MVP returns token; production will email)
- Complex admin dashboard UI (admin endpoints are API-only initially)
- Phone-based auth/OTP (can be phase 2)

---

## 2. Users & personas

### 2.1 Primary persona: Learner driver
- Uses Android phone
- Wants quick offline practice
- May have intermittent data
- Prefers M-PESA payments

### 2.2 Secondary persona: Admin/operator
- Manages support requests
- Reviews payments and resolves disputes
- Needs visibility into subscription status

---

## 3. User stories

### 3.1 Authentication
- As a learner, I can register with email + password.
- As a learner, I can log in and remain signed in.
- As a learner, I can log out.
- As a learner, I can request a password reset.

### 3.2 Profile
- As a learner, I can view and edit my name and phone number.

### 3.3 Subscription & entitlements
- As a learner, I can see whether I’m free or premium.
- As a learner, premium unlocks automatically after payment success.
- As a learner, premium expires automatically after the plan duration.

### 3.4 Payments — M-PESA STK push
- As a learner, I can initiate an STK push for a selected plan.
- As a learner, I can see payment status updates (pending / paid / failed).
- As a learner, once paid, the app unlocks premium.

### 3.5 Payments — Manual receipt (fallback)
- As a learner, I can submit a manual M-PESA receipt if STK callback fails.
- As an admin, I can later reconcile manual receipts.

### 3.6 Payments — Paystack (optional)
- As a learner, I can pay via Paystack and unlock premium.

---

## 4. Functional requirements

### 4.1 Backend requirements
- Hosted on Railway
- Postgres database
- REST API with JSON
- JWT auth:
  - token issued on register/login
  - token required for protected routes
- Payments:
  - create payment record before initiating payment provider
  - update payment record on callback / verification
  - grant entitlement on successful payment
- Entitlements:
  - status returned via `/api/me/entitlements`
  - expiry date enforced server-side

### 4.2 Android requirements
- Remove FirebaseAuth and FirebaseFirestore usage
- Store JWT in EncryptedPrefs
- All protected API calls include `Authorization: Bearer <token>`
- Keep offline-first exam features unchanged

---

## 5. API specification (MVP)

### 5.1 Auth
- `POST /api/auth/register`
  - body: `{email,password,name?,phone?}`
  - response: `{token, user:{id,email,name?,phone?}}`
- `POST /api/auth/login`
  - body: `{email,password}`
  - response: `{token, user:{...}}`
- `POST /api/auth/reset-password`
  - body: `{email}`
  - response (MVP): `{ok:true, resetToken?:string}`

### 5.2 Profile
- `GET /api/me/profile` (JWT)
- `PUT /api/me/profile` (JWT)
  - body: `{name?, phone?}`

### 5.3 Entitlements
- `GET /api/me/entitlements` (JWT)
  - response: `{status, plan?, expiresAt?}`

### 5.4 Payments — M-PESA
- `POST /api/payments/mpesa/stk-push` (JWT)
  - body: `{phoneNumber, planId, amount?}`
  - response: `{serverPaymentId, merchantRequestId?, checkoutRequestId?, status}`
- `POST /api/payments/mpesa/callback` (Safaricom)
- `GET /api/payments/status?paymentId=...` (JWT)
- `POST /api/payments/mpesa/manual-receipt` (JWT)
  - body: `{receipt, planId, phoneNumber?, amount?}`

### 5.5 Payments — Paystack
- `POST /api/paystack/initialize` (JWT)
  - body: `{plan}`
  - response: `{checkoutUrl?, reference?}`
- `GET /api/paystack/verify?reference=...` (JWT)
  - response: `{success:boolean}`

---

## 6. Data model (Postgres)

### 6.1 User
- id (cuid)
- email (unique)
- passwordHash
- name, phone
- timestamps

### 6.2 Subscription
- userId (unique)
- status: free | active | expired
- planType
- startDate, expiryDate

### 6.3 Payment
- provider: mpesa | paystack
- status: PENDING | PAID | FAILED | CANCELLED | TIMEOUT
- planId, amount, currency
- provider identifiers (checkoutRequestId, merchantRequestId, reference)
- mpesaReceipt
- rawInitJson, rawCallbackJson

---

## 7. UX requirements

### 7.1 Authentication UX
- Clear error messages on login/register
- Keep user signed in (JWT persisted)

### 7.2 Subscription UX
- “Free” vs “Premium” clearly visible
- Expiry shown where relevant

### 7.3 Payment UX
- Show status polling after STK initiated
- Provide manual receipt fallback link if status stuck

---

## 8. Success metrics
- % of successful STK push transactions leading to premium unlock
- Payment dispute rate
- Subscription conversion rate
- Crash-free sessions after removing Firebase
- Backend latency p95 < 500ms (Kenya)

---

## 9. Risks & mitigations

1. **User migration** (existing Firebase users)
   - Mitigation: force password reset or re-registration; later build importer
2. **Daraja callback delivery**
   - Mitigation: set correct `BASE_URL_PUBLIC`, add allowlist, keep manual receipt fallback
3. **Fraud / manual receipt abuse**
   - Mitigation: keep manual receipts flagged `matched=false`, require admin reconciliation for high-risk cases
4. **Secrets leakage**
   - Mitigation: Railway variables only, never commit `.env`

---

## 10. Rollout plan

### Phase 0: Dev sandbox
- Deploy API to Railway with sandbox Daraja credentials
- Internal testing

### Phase 1: Limited release
- Roll out to a small user segment
- Monitor payment success + entitlement correctness

### Phase 2: Full release
- Deprecate Firebase endpoints
- Remove Firebase config files from app build

---

## 11. Open questions
- Keep Paystack enabled or only M-PESA?
- Do we want phone-number-only signup (OTP) for Kenya?
- Do we need an admin web dashboard, or API + simple scripts is enough?
