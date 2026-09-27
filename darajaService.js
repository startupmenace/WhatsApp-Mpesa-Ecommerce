const axios = require("axios");

const {
  DARAJA_CONSUMER_KEY,
  DARAJA_CONSUMER_SECRET,
  DARAJA_SHORTCODE,
  DARAJA_PASSKEY,
  DARAJA_ENV,
  DARAJA_CALLBACK_URL,
} = process.env;

const BASE_URL =
  DARAJA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

/**
 * Generates the YYYYMMDDHHmmss timestamp Daraja expects, in the
 * Africa/Nairobi timezone (which is what Safaricom's servers use).
 */
function generateTimestamp() {
  const now = new Date();
  const nairobiOffsetMs = 3 * 60 * 60 * 1000; // EAT is UTC+3, no DST
  const nairobiTime = new Date(now.getTime() + nairobiOffsetMs);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    nairobiTime.getUTCFullYear().toString() +
    pad(nairobiTime.getUTCMonth() + 1) +
    pad(nairobiTime.getUTCDate()) +
    pad(nairobiTime.getUTCHours()) +
    pad(nairobiTime.getUTCMinutes()) +
    pad(nairobiTime.getUTCSeconds())
  );
}

/**
 * Password = Base64( Shortcode + Passkey + Timestamp )
 */
function generatePassword(timestamp) {
  const raw = `${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

/**
 * Fetches a fresh Daraja OAuth access token.
 * NOTE: tokens are valid for ~1 hour. For high-traffic production use,
 * cache this and only refetch when it expires, instead of calling it on
 * every STK Push.
 */
async function getAccessToken() {
  const credentials = Buffer.from(
    `${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  return response.data.access_token;
}

/**
 * Triggers an STK Push (Lipa Na M-Pesa Online) prompt on the customer's phone.
 *
 * @param {string} phone            Daraja-format phone, e.g. "254712345678"
 * @param {number} amount           Whole-number KES amount
 * @param {string} accountReference Shown to the customer, max ~12 chars
 * @param {string} transactionDesc  Short description, max ~13 chars used by Daraja
 * @returns {Promise<object>}       Raw Daraja response, includes CheckoutRequestID
 */
async function initiateSTKPush({
  phone,
  amount,
  accountReference,
  transactionDesc,
}) {
  const accessToken = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);

  const payload = {
    BusinessShortCode: DARAJA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: DARAJA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: DARAJA_CALLBACK_URL,
    AccountReference: accountReference.slice(0, 12),
    TransactionDesc: transactionDesc.slice(0, 13),
  };

  const response = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response.data; // includes CheckoutRequestID, MerchantRequestID, ResponseCode
}

/**
 * Queries the status of an earlier STK Push using the CheckoutRequestID.
 * This is faster than waiting only on the callback and helps confirm the
 * transaction status sooner, while the callback remains the final source.
 */
async function querySTKStatus(checkoutRequestId) {
  const accessToken = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);

  const payload = {
    BusinessShortCode: DARAJA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const response = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response.data;
}

module.exports = {
  getAccessToken,
  generateTimestamp,
  generatePassword,
  initiateSTKPush,
  querySTKStatus,
};
