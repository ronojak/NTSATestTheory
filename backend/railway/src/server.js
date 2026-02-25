/**
 * NTSA Test Theory API (Railway + Postgres)
 * - Replaces Firebase Cloud Functions + Firestore
 * - Provides Auth (JWT), Profiles, Subscriptions, Payments (M-PESA Daraja + Paystack)
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');

const { authRouter } = require('./routes/auth');
const { meRouter } = require('./routes/me');
const { paymentsRouter } = require('./routes/payments');
const { adminRouter } = require('./routes/admin');

const app = express();

app.set('trust proxy', true);
app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// Health check must be before Prisma middleware so it works even if DB is unavailable
app.get('/health', (_req, res) => res.json({ ok: true }));

// Lazy Prisma initialisation — crashes here instead of at startup if DATABASE_URL is missing
let _prisma = null;
function getPrisma() {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

// attach prisma
app.use((req, _res, next) => { req.prisma = getPrisma(); next(); });

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api', paymentsRouter);
app.use('/api/admin', adminRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

// error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'server_error', detail: err && err.message ? err.message : String(err) });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on :${port}`));