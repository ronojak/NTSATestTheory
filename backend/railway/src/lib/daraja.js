const axios = require('axios');

function darajaBase() {
  const env = (process.env.DARAJA_ENV || 'sandbox').toLowerCase();
  return env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
}

function formatTimestampNairobi(date = new Date()) {
  // Kenya is UTC+3 (no DST). Format yyyyMMddHHmmss.
  const utc = date.getTime();
  const eat = new Date(utc + 3 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    eat.getUTCFullYear() +
    pad(eat.getUTCMonth() + 1) +
    pad(eat.getUTCDate()) +
    pad(eat.getUTCHours()) +
    pad(eat.getUTCMinutes()) +
    pad(eat.getUTCSeconds())
  );
}

async function getDarajaToken() {
  const key = process.env.DARAJA_CONSUMER_KEY;
  const secret = process.env.DARAJA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error('Missing DARAJA_CONSUMER_KEY / DARAJA_CONSUMER_SECRET');
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const url = `${darajaBase()}/oauth/v1/generate?grant_type=client_credentials`;
  const res = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return res.data.access_token;
}

async function stkPush({ phoneNumber, amount, accountReference, transactionDesc, callbackUrl }) {
  const shortcode = process.env.DARAJA_SHORTCODE;
  const passkey = process.env.DARAJA_PASSKEY;
  const txnType = process.env.DARAJA_TRANSACTION_TYPE || 'CustomerPayBillOnline';
  if (!shortcode || !passkey) throw new Error('Missing DARAJA_SHORTCODE / DARAJA_PASSKEY');
  const timestamp = formatTimestampNairobi();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const token = await getDarajaToken();
  const url = `${darajaBase()}/mpesa/stkpush/v1/processrequest`;
  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: txnType,
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc
  };
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

module.exports = { stkPush };