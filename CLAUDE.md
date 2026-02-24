# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DriveTheory CBT** is an offline-first Android app for randomized Kenya driving license theory exams. The backend recently migrated from Firebase to a self-hosted Express + PostgreSQL backend on Railway.

## Android Build & Test Commands

```bash
./gradlew assembleDebug          # Build debug APK
./gradlew installDebug           # Deploy to device/emulator
./gradlew testDebugUnitTest      # Run unit tests
./gradlew connectedAndroidTest   # Run instrumentation tests (requires device/emulator)
./gradlew lint ktlintFormat detekt  # Lint, format, static analysis
./gradlew clean                  # Clean build outputs
```

Requirements: JDK 17, Android SDK 34+. Run via Android Studio for faster iteration.

## Backend Commands

```bash
cd backend/railway
npm install
npx prisma generate              # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create and apply a new migration
npx prisma migrate deploy        # Apply migrations in production
npm run dev                      # Development server (http://localhost:8080)
npm start                        # Production server
```

## Architecture

The Android app follows **Clean Architecture** with five layers:

- **`core/`** — Low-level utilities: JWT handling, `EncryptedSharedPreferences`, Retrofit setup, `Result<T>` wrapper, access gating.
- **`data/`** — Repositories and API clients: Room entities/DAOs for local storage, Retrofit interfaces for remote (auth, user, subscription, M-PESA, billing). Seed loader reads `assets/seed/questions_seed.json` into Room at first launch.
- **`domain/`** — Pure Kotlin models (`Question`, `Exam`), repository interfaces, and use cases (`LoginUserUseCase`, etc.). No Android dependencies.
- **`engine/`** — `ExamEngine.kt` drives the exam session: question subset randomization, answer option shuffling, navigation (next/prev), and scoring. `TimerController.kt` manages the countdown.
- **`presentation/`** — Jetpack Compose screens and ViewModels organized by feature (auth, exam, results, history, billing, M-PESA, account). Navigation wired in `navigation/`.
- **`di/`** — Hilt modules providing scoped dependencies across all layers.

The backend (`backend/railway/`) is an Express REST API with:
- Prisma ORM over PostgreSQL (schema: `backend/railway/prisma/schema.prisma`)
- JWT Bearer authentication via middleware
- M-PESA Daraja and Paystack payment integrations (`src/lib/`)
- Routes split by domain: `auth`, `me`, `payments`, `paystack`, `admin`

## Key Files

| File | Purpose |
|------|---------|
| `app/build.gradle.kts` | Android dependencies and `BACKEND_BASE_URL` build config |
| `backend/railway/prisma/schema.prisma` | Postgres data model (User, Subscription, Payment) |
| `backend/railway/src/server.js` | Express entry point and route wiring |
| `engine/ExamEngine.kt` | Core exam logic — randomization, scoring, navigation |
| `data/seed/` | JSON question bank loader |
| `TODO_RAILWAY_MIGRATION.md` | Remaining tasks for Firebase → Railway migration |
| `docs/RAILWAY_DEPLOY.md` | Railway deployment steps |

## Coding Conventions

- Kotlin + Compose; 4-space indent; max line length 100; no wildcard imports.
- Naming suffixes: `*Screen`, `*ViewModel`, `*UseCase`, `*Repository(Impl)`, `*Entity`, `*Dto`.
- Conventional Commits: `feat(engine): …`, `fix(auth): …`, `test(domain): …`.
- Unit tests (`FooBarTest.kt`) in `app/src/test/`; instrumented tests (`FooBarIT.kt`) in `app/src/androidTest/`.
- Coverage target: ≥80% for `engine` and `domain` layers.

## Environment Configuration

**Android** (`app/build.gradle.kts` / `local.properties`):
- `BACKEND_BASE_URL` — points to Railway deployment URL or local dev server.

**Backend** (`.env` or Railway environment variables):
- `DATABASE_URL`, `JWT_SECRET`, `BASE_URL_PUBLIC` — required.
- `DARAJA_ENV`, `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_SHORTCODE`, `DARAJA_PASSKEY` — M-PESA.
- `PAYSTACK_SECRET` — Paystack.
- See `backend/.env.example` for the full list.

## Migration Status (Firebase → Railway)

The Firebase SDK is still present in the project but is being removed. `google-services.json` is kept for reference only. Key completed items: Railway Express API, PostgreSQL, JWT auth, M-PESA + Paystack integration, encrypted local token storage. Remaining: full QA end-to-end flow, Firebase SDK removal, staged rollout.
