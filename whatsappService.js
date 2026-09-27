const twilio = require("twilio");

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } =
  process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Sends a plain text WhatsApp message via the REST API (not TwiML).
 * Used for anything sent OUTSIDE the immediate webhook reply — e.g. the
 * async Daraja callback, or extra catalogue messages after the first reply.
 */
async function sendText(to, body) {
  return client.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to, // must be in "whatsapp:+2547XXXXXXXX" format
    body,
  });
}

/**
 * Sends an image with an optional caption.
 */
async function sendMedia(to, body, mediaUrl) {
  try {
    let url = String(mediaUrl || "");

    // If URL is relative (starts with /), make it absolute using BASE_URL
    if (url.startsWith("/")) {
      const base = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, "");
      url = base + url;
    }

    // Append a cache-busting timestamp so external fetchers (Twilio) get the latest image
    const sep = url.includes("?") ? "&" : "?";
    url = url + sep + "t=" + Date.now();

    return client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to,
      body,
      mediaUrl: [url],
    });
  } catch (err) {
    console.error('sendMedia error:', err && err.message ? err.message : err);
    throw err;
  }
}

/**
 * Sends the full visual catalogue: one WhatsApp message per product, each
 * with its image + name/price/description as the caption.
 *
 * WHY separate messages instead of one? WhatsApp (via Twilio) does not
 * support a scrollable "product carousel" unless you set up Meta's native
 * WhatsApp Business Catalog (via Facebook Commerce Manager) and use Twilio's
 * Content Templates API to reference it. That's a heavier one-time setup
 * (Meta business verification + catalog sync) but gives a real tappable
 * catalogue UI. This lightweight approach (separate image+caption messages)
 * works immediately with just a Twilio WhatsApp sender and looks fine for
 * a handful of products.
 */
async function sendCatalog(to, products) {
  for (const product of products) {
    const caption =
      `*${product.name}*\n\n` +
      `Price: *KES ${product.price.toLocaleString()}*\n` +
      `Description: ${product.description}\n\n` +
      `Reply *BUY ${product.id}* to purchase this item.`;

    // eslint-disable-next-line no-await-in-loop
    try {
      console.log(`Sending product ${product.id} to ${to} (image: ${product.imageUrl})`);
      const res = await sendMedia(to, caption, product.imageUrl);
      console.log(`Sent product ${product.id} message id=${res.sid}`);
    } catch (err) {
      console.error(`Failed to send product ${product.id}:`, err && err.message ? err.message : err);
    }
  }
}

module.exports = { client, sendText, sendMedia, sendCatalog };
