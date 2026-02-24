const express = require('express');
const { requireAuth } = require('../lib/authMiddleware');

const meRouter = express.Router();
meRouter.use(requireAuth);

meRouter.get('/profile', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.sub;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  return res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone });
});

meRouter.put('/profile', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.sub;
  const { name, phone } = req.body || {};
  const user = await prisma.user.update({ where: { id: userId }, data: { name: name ?? null, phone: phone ?? null } });
  return res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone });
});

meRouter.get('/entitlements', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.sub;
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return res.json({ status: 'free', plan: null, expiresAt: null });

  const expiresAt = sub.expiryDate ? sub.expiryDate.getTime() : null;
  // If expiry is in the past, return expired unless free
  let status = sub.status || 'free';
  if (expiresAt && expiresAt < Date.now() && status === 'active') status = 'expired';
  return res.json({ status, plan: sub.planType, expiresAt });
});

module.exports = { meRouter };