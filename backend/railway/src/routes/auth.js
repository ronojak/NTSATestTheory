const express = require('express');
const crypto = require('crypto');
const { signToken } = require('../lib/jwt');
const { hashPassword, verifyPassword } = require('../lib/password');

const authRouter = express.Router();

/**
 * POST /api/auth/register
 * body: { email, password, name?, phone? }
 */
authRouter.post('/register', async (req, res) => {
  const prisma = req.prisma;
  const { email, password, name, phone } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_and_password_required' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'email_already_exists' });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, name: name || null, phone: phone || null } });
  // create a default subscription row
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, status: 'free' },
    update: {}
  });

  const token = signToken(user);
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
authRouter.post('/login', async (req, res) => {
  const prisma = req.prisma;
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_and_password_required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const token = signToken(user);
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });
});

/**
 * POST /api/auth/reset-password
 * body: { email }
 *
 * NOTE: In MVP this creates a reset token and returns it.
 * In production, integrate an email provider (Mailgun/Sendgrid) and send a link.
 */
authRouter.post('/reset-password', async (req, res) => {
  const prisma = req.prisma;
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email_required' });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return ok to avoid leaking user existence.
  if (!user) return res.json({ ok: true });

  const raw = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await prisma.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt } });

  return res.json({ ok: true, resetToken: raw });
});

module.exports = { authRouter };