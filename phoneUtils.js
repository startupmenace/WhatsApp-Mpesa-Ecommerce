/**
 * Twilio sends the sender's number as e.g.  "whatsapp:+254712345678"
 * Daraja needs the clean local-international format:  "254712345678"
 * This file converts safely both ways.
 */

/**
 * "whatsapp:+254712345678" -> "254712345678"
 * Also tolerates numbers that start with 0 (07XXXXXXXX) by rewriting to 2547XXXXXXXX.
 */
function toDarajaFormat(twilioFrom) {
  if (!twilioFrom) return null;

  // Strip the "whatsapp:" channel prefix and any leading "+"
  let digits = twilioFrom.replace(/^whatsapp:/i, "").replace(/^\+/, "");

  // Strip any remaining non-digit characters (spaces, dashes, etc.)
  digits = digits.replace(/\D/g, "");

  // Normalise local 07XXXXXXXX / 01XXXXXXXX -> 2547XXXXXXXX / 2541XXXXXXXX
  if (digits.startsWith("0") && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  }

  // Basic sanity check: Kenyan MSISDNs are 12 digits starting with 254
  if (!/^254\d{9}$/.test(digits)) {
    return null;
  }

  return digits;
}

/**
 * "254712345678" -> "whatsapp:+254712345678"
 * Used when we need to message a number back (e.g. from a stored session)
 * rather than replying directly to an inbound webhook.
 */
function toWhatsAppAddress(darajaPhone) {
  const digits = String(darajaPhone).replace(/\D/g, "");
  return `whatsapp:+${digits}`;
}

module.exports = { toDarajaFormat, toWhatsAppAddress };
