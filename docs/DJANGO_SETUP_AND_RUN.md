# NTSA Test Theory — Django Backend (Firebase-free)

This folder provides a Django REST API backend that replaces Firebase Auth/Firestore/Functions.

## Folder
`backend/django_api/`

## What this backend includes
- Django + DRF
- JWT auth via SimpleJWT (`Authorization: Bearer <token>`)
- `/health`
- `/api/auth/register`, `/api/auth/login`
- `/api/me/` (GET/PATCH)
- M-PESA Daraja STK Push + callback:
  - `POST /api/payments/mpesa/stk-push` (auth required)
  - `POST /api/payments/mpesa/callback` (no auth)

> Paystack is stubbed as env-only for now (you can extend it similarly).

---

## Step-by-step: Install Django and run locally (Ubuntu/macOS)

### 1) Go to the Django backend folder
```bash
cd "backend/django_api"
```

### 2) Create & activate a virtual environment
**macOS/Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3) Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4) Create your `.env`
Copy the example and fill credentials:
```bash
cp .env.example .env
```

Minimum you should set for local running:
- `DJANGO_SECRET_KEY`
- `BASE_URL_PUBLIC=http://localhost:8000`

If testing Daraja STK push, fill:
- `DARAJA_ENV=sandbox`
- `DARAJA_CONSUMER_KEY`
- `DARAJA_CONSUMER_SECRET`
- `DARAJA_SHORTCODE`
- `DARAJA_PASSKEY`

### 5) Migrate the database
**SQLite (default)**
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6) Create an admin user (optional)
```bash
python manage.py createsuperuser
```

### 7) Run the server
```bash
python manage.py runserver 0.0.0.0:8000
```

### 8) Test quickly
```bash
curl http://localhost:8000/health
```

Register:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Passw0rd!","name":"Test","phone":"+254700000000"}'
```

---

## Step-by-step: Deploy to Railway

### A) Create Railway project
1. Railway → New Project
2. Deploy from GitHub
3. Set service root directory to: `backend/django_api`

### B) Add Postgres
Railway → Add Plugin → PostgreSQL  
Railway will inject `DATABASE_URL` automatically.

### C) Set environment variables on Railway
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=0`
- `DJANGO_ALLOWED_HOSTS=*.up.railway.app,<your-custom-domain>`
- `BASE_URL_PUBLIC=https://<your-railway-domain>`

Plus your Daraja keys if using M-PESA:
- `DARAJA_ENV`
- `DARAJA_CONSUMER_KEY`
- `DARAJA_CONSUMER_SECRET`
- `DARAJA_SHORTCODE`
- `DARAJA_PASSKEY`

### D) Run migrations on Railway
In Railway service → Shell:
```bash
python manage.py migrate
```

### E) Verify
- `GET https://<railway-domain>/health`
- Register/login from your Android app using that base URL

---

## Point the Android app to this backend
Use your API base URL in the Android config (where the project stores it).  
Example:
`https://<railway-domain>`

Endpoints match the existing REST structure.
