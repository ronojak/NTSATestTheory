const axios = require('axios');

const PAYSTACK_BASE = 'https://api.paystack.co';

function paystackClient() {
  const secret = process.env.PAYSTACK_SECRET;
  if (!secret) throw new Error('PAYSTACK_SECRET not set');
  return axios.create({ baseURL: PAYSTACK_BASE, headers: { Authorization: `Bearer ${secret}` } });
}

async function initializeTransaction({ email, amountKobo, callback_url, metadata }) {
  const client = paystackClient();
  const res = await client.post('/transaction/initialize', { email, amount: amountKobo, callback_url, metadata });
  return res.data;
}

async function verifyTransaction(reference) {
  const client = paystackClient();
  const res = await client.get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return res.data;
}

module.exports = { initializeTransaction, verifyTransaction };