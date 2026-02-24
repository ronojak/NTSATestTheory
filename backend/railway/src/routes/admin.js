const express = require('express');
const { requireAuth, requireAdmin } = require('../lib/authMiddleware');

const adminRouter = express.Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/payments', async (req, res) => {
  const prisma = req.prisma;
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const items = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  return res.json(items.map(p => ({
    id: p.id,
    provider: p.provider,
    status: p.status,
    planId: p.planId,
    amount: p.amount,
    userId: p.userId,
    createdAt: p.createdAt.getTime(),
    updatedAt: p.updatedAt.getTime()
  })));
});

adminRouter.get('/payments/:id', async (req, res) => {
  const prisma = req.prisma;
  const id = req.params.id;
  const p = await prisma.payment.findUnique({ where: { id } });
  if (!p) return res.status(404).json({ error: 'not_found' });
  return res.json(p);
});

module.exports = { adminRouter };