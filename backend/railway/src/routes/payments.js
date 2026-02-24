const express = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../lib/authMiddleware');
const { stkPush } = require('../lib/daraja');
const { initializeTransaction, verifyTransaction } = require('../lib/paystack');
const { getClientIp } = require('../lib/http');

const paymentsRouter = express.Router();

/**
 * Plans (simple map). Adjust pricing here or move to DB later.
 * Amount is in KES.
 */
const PLANS = {
  weekly: { amount: 100, days: 7 },
  monthly: { amount: 300, days: 30 },
  yearly: { amount: 2000, days: 365 }
};

function requirePlan(planId) {
  const p = PLANS[String(planId || '').toLowerCase()];
  if (!p) throw new Error('invalid_plan');
  return p;
}

async function grantEntitlement(prisma, userId, planId) {
  const plan = requirePlan(planId);
  const start = new Date();
  const expiry = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, status: 'active', planType: planId, startDate: start, endDate: expiry, expiryDate: expiry },
    update: { status: 'active', planType: planId, startDate: start, endDate: expiry, expiryDate: expiry }
  });
}

/**
 * POST /api/payments/mpesa/stk-push
 * body: { phoneNumber, planId, amount? }
 */
paymentsRouter.post('/payments/mpesa/stk-push', requireAuth, async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.sub;
  const { phoneNumber, planId, amount } = req.body || {};
  if (!phoneNumber || !planId) return res.status(400).json({ error: 'phoneNumber_and_planId_required' });

  const plan = requirePlan(planId);
  const finalAmount = Number(amount || plan.amount);
  const baseUrlPublic = process.env.BASE_URL_PUBLIC; // e.g. https://your-railway-app.up.railway.app
  const callbackPath = process.env.DARAJA_CALLBACK_PATH || '/api/payments/mpesa/callback';
  if (!baseUrlPublic) return res.status(500).json({ error: 'BASE_URL_PUBLIC_not_set' });
  const callbackUrl = `${baseUrlPublic.replace(/\/$/, '')}${callbackPath}`;

  const payment = await prisma.payment.create({
    data: {
      userId,
      provider: 'mpesa',
      status: 'PENDING',
      planId: String(planId),
      amount: finalAmount,
      phone: String(phoneNumber)
    }
  });

  const daraja = await stkPush({
    phoneNumber: String(phoneNumber),
    amount: finalAmount,
    accountReference: `NTSA-${payment.id}`,
    transactionDesc: `NTSA plan ${planId}`,
    callbackUrl
  });

  const merchantRequestId = daraja.MerchantRequestID || null;
  const checkoutRequestId = daraja.CheckoutRequestID || null;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { merchantRequestId, checkoutRequestId, rawInitJson: daraja }
  });

  return res.json({
    serverPaymentId: payment.id,
    merchantRequestId,
    checkoutRequestId,
    status: 'PENDING'
  });
});

/**
 * POST /api/payments/mpesa/callback
 * Safaricom hits this URL. Do not require auth.
 */
paymentsRouter.post('/payments/mpesa/callback', async (req, res) => {
  try {
    const prisma = req.prisma;
    const ip = getClientIp(req);
    const allowlist = (process.env.DARAJA_CALLBACK_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowlist.length && !allowlist.includes(ip)) return res.status(403).json({ error: 'forbidden' });

    const body = req.body || {};
    const callback = ((body.Body || {}).stkCallback) || {};
    const merchantRequestId = callback.MerchantRequestID || null;
    const checkoutRequestId = callback.CheckoutRequestID || null;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;
    const items = (((callback.CallbackMetadata || {}).Item) || []);
    const byName = Object.fromEntries(items.map(i => [i.Name, i.Value]));
    const mpesaReceipt = byName['MpesaReceiptNumber'] || byName['MpesaReceipt'] || null;
    const amount = byName['Amount'] || null;
    const phone = byName['PhoneNumber'] || byName['MSISDN'] || null;

    // find payment
    let payment = null;
    if (checkoutRequestId) payment = await prisma.payment.findFirst({ where: { checkoutRequestId: String(checkoutRequestId) } });
    if (!payment && merchantRequestId) payment = await prisma.payment.findFirst({ where: { merchantRequestId: String(merchantRequestId) } });

    if (!payment) {
      // accept anyway
      console.warn('Orphan callback', { checkoutRequestId, merchantRequestId });
      return res.json({ received: true });
    }

    const terminal = ['PAID','FAILED','CANCELLED','TIMEOUT'];
    let newStatus = payment.status || 'PENDING';
    if (resultCode === 0 || resultCode === '0' || (resultDesc && String(resultDesc).toLowerCase().includes('success'))) newStatus = 'PAID';
    else if (Number(resultCode) === 1032) newStatus = 'CANCELLED';
    else if (Number(resultCode) === 1) newStatus = 'FAILED';

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: terminal.includes(payment.status) ? payment.status : newStatus,
        resultCode: typeof resultCode === 'number' ? resultCode : (resultCode != null ? Number(resultCode) : null),
        resultDesc: resultDesc || null,
        mpesaReceipt: mpesaReceipt || null,
        phone: phone ? String(phone) : payment.phone,
        amount: amount != null ? Number(amount) : payment.amount,
        rawCallbackJson: body
      }
    });

    if (updated.status === 'PAID' && !terminal.includes(payment.status) && updated.userId) {
      await grantEntitlement(prisma, updated.userId, updated.planId);
    }

    return res.json({ received: true });
  } catch (e) {
    console.error('callback error', e);
    return res.status(500).json({ error: 'callback_failed', detail: e.message });
  }
});

/**
 * GET /api/payments/status?paymentId=
 */
paymentsRouter.get('/payments/status', requireAuth, async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.sub;
  const paymentId = req.query.paymentId;
  if (!paymentId) return res.status(400).json({ error: 'paymentId_required' });

  const p = await prisma.payment.findFirst({ where: { id: String(paymentId), userId } });
  if (!p) return res.status(404).json({ error: 'not_found' });

  return res.json({
    paymentId: p.id,
    status: p.status,
    planId: p.planId,
    amount: p.amount,
    checkoutRequestId: p.checkoutRequestId,
    merchantRequestId: p.merchantRequestId,
    resultCode: p.resultCode,
    resultDesc: p.resultDesc,
    mpesaReceipt: p.mpesaReceipt,
    updatedAt: p.updatedAt.getTime()
  });
});

/**
 * POST /api/paystack/initialize
 * body: { plan }
 */
paymentsRouter.post('/paystack/initialize', requireAuth, async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.sub;
  const { plan } = req.body || {};
  if (!plan) return res.status(400).json({ error: 'plan_required' });

  const planCfg = requirePlan(plan);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const reference = `ps_${crypto.randomBytes(12).toString('hex')}`;
  const callback_url = process.env.PAYSTACK_CALLBACK_URL || null;

  const init = await initializeTransaction({
    email: user.email,
    amountKobo: planCfg.amount * 100,
    callback_url,
    metadata: { userId, plan }
  });

  if (!init.status) return res.status(502).json({ error: 'paystack_init_failed', detail: init.message });

  const authUrl = init.data?.authorization_url || null;

  await prisma.payment.create({
    data: {
      userId,
      provider: 'paystack',
      status: 'PENDING',
      planId: String(plan),
      amount: planCfg.amount,
      currency: 'KES',
      reference,
      checkoutUrl: authUrl,
      rawInitJson: init
    }
  });

  return res.json({ checkoutUrl: authUrl, reference });
});

/**
 * GET /api/paystack/verify?reference=
 */
paymentsRouter.get('/paystack/verify', requireAuth, async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.sub;
  const reference = req.query.reference;
  if (!reference) return res.status(400).json({ error: 'reference_required' });

  const p = await prisma.payment.findFirst({ where: { reference: String(reference), userId } });
  if (!p) return res.status(404).json({ error: 'not_found' });

  const v = await verifyTransaction(String(reference));
  const success = Boolean(v.status && v.data && v.data.status === 'success');

  if (success && p.status !== 'PAID') {
    await prisma.payment.update({ where: { id: p.id }, data: { status: 'PAID' } });
    await grantEntitlement(prisma, userId, p.planId);
  } else if (!success && p.status === 'PENDING') {
    // keep pending, user may still pay
  }

  return res.json({ success });
});

/**
 * POST /api/payments/mpesa/manual-receipt
 * body: { receipt, planId, phoneNumber?, amount? }
 *
 * MVP behavior:
 * - stores the receipt as a PAID payment (trust-based) with matched=false.
 * - Admin can later reconcile receipts against official statements.
 * You can tighten this later by integrating C2B validation / reconciliation APIs.
 */
paymentsRouter.post('/payments/mpesa/manual-receipt', requireAuth, async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.sub;
  const { receipt, planId, phoneNumber, amount } = req.body || {};
  if (!receipt || !planId) return res.status(400).json({ error: 'receipt_and_planId_required' });

  const plan = requirePlan(planId);
  const finalAmount = Number(amount || plan.amount);

  const payment = await prisma.payment.create({
    data: {
      userId,
      provider: 'mpesa',
      status: 'PAID',
      planId: String(planId),
      amount: finalAmount,
      mpesaReceipt: String(receipt).trim(),
      phone: phoneNumber ? String(phoneNumber) : null
    }
  });

  await grantEntitlement(prisma, userId, planId);

  return res.json({ paymentId: payment.id, status: payment.status, matched: false });
});

module.exports = { paymentsRouter };