# WhatsApp + M-Pesa STK Push Store

A Node.js/Express backend that lets customers browse a visual product
catalogue and pay via Safaricom M-Pesa STK Push — all inside a WhatsApp chat,
powered by Twilio.

## How the flow works

1. Customer sends **"HI"** → bot replies with a welcome message, then sends
   one WhatsApp message per product (image + name + price + description).
2. Customer replies **"BUY 2"** → bot triggers a Daraja STK Push to their
   phone and tells them to check for the M-Pesa PIN prompt.
3. Customer enters their PIN → Safaricom calls your `/stk-callback` →
   bot sends a WhatsApp confirmation (with receipt number) or a failure
   message.

## 1. Install

```bash
npm install
cp .env.example .env
```

Fill in `.env` with:
- **Twilio**: Account SID + Auth Token from the [Twilio Console](https://console.twilio.com), and your WhatsApp sender (the sandbox number `whatsapp:+14155238886` while testing).
- **Daraja**: Consumer Key/Secret from the [Daraja Portal](https://developer.safaricom.co.ke), your Shortcode + Passkey (use the standard sandbox test shortcode `174379` and its published passkey while testing).

## 2. Expose your server publicly

Both Twilio and Safaricom need to reach your server over HTTPS. In
development, use ngrok:

```bash
ngrok http 3000
```

Use the `https://xxxx.ngrok.io` URL for:
- Twilio Sandbox → "When a message comes in" → `https://xxxx.ngrok.io/whatsapp`
- `DARAJA_CALLBACK_URL` in `.env` → `https://xxxx.ngrok.io/stk-callback`

## 3. Run

```bash
npm start
# or, with auto-reload:
npm run dev
```

## 4. Test

- In WhatsApp, message your Twilio sandbox number **"join <your-sandbox-code>"** once to opt in, then send **"HI"**.
- Reply **"BUY 1"**. On Daraja sandbox, use test MSISDN `254708374149` and any PIN (sandbox always accepts).

## Adding a real visual catalogue

Update `data/products.js` — each product needs a **public HTTPS image URL**
(Twilio fetches it server-side; localhost/private URLs won't work). Good
free/cheap options: Cloudinary, Imgur, S3 + CloudFront, or your own CDN.

This project sends the catalogue as **separate image+caption messages**
because that works immediately with any Twilio WhatsApp sender. If you want
Meta's native, tappable **WhatsApp Business Catalog** (Commerce Manager
product grid with a real "View catalog" button), that requires:
1. A Meta Business verification + WhatsApp Business Platform sender (not the sandbox).
2. Uploading products to Facebook Commerce Manager.
3. Using Twilio's [Content Templates / Catalog messages](https://www.twilio.com/docs/whatsapp) API instead of plain `messages.create()`.
That's a heavier one-time setup — happy to help wire that up separately once you're on a production WhatsApp sender.

## Production hardening checklist

This is a working starting point, not a finished production system. Before
going live, address:

- **Persistent session store**: `utils/session.js` uses an in-memory `Map`.
  It's wiped on restart and won't work across multiple server instances.
  Swap it for Redis (or your DB) with a TTL (e.g. 10 min) so abandoned STK
  pushes get cleaned up.
- **Webhook signature validation**: verify Twilio's `X-Twilio-Signature`
  header (`twilio.validateRequest`) so nobody can spoof `/whatsapp` requests.
- **Idempotency**: Safaricom can call `/stk-callback` more than once for the
  same `CheckoutRequestID` — guard against sending duplicate confirmations
  (e.g. check-and-delete the pending order atomically, or dedupe by
  `MpesaReceiptNumber` in your DB).
- **Order persistence**: log every order/payment to a real database, not
  just in-memory state, so you have a paper trail and can reconcile with
  Safaricom's statements.
- **Access token caching**: `getAccessToken()` is called on every purchase;
  Daraja tokens last ~1 hour, so cache and reuse it to cut latency and stay
  under rate limits.
- **Rate limiting / abuse protection** on `/whatsapp` and `/stk-callback`.
- **Rotate any credentials** that were ever pasted into a chat, ticket, repo,
  or screenshot.

## Project structure

```
.
├── server.js                  # Express app entrypoint
├── routes/
│   ├── whatsappRoutes.js      # POST /whatsapp — conversational flow
│   └── callbackRoutes.js      # POST /stk-callback — payment result handler
├── services/
│   ├── darajaService.js       # OAuth token, timestamp/password, STK Push
│   └── whatsappService.js     # Twilio send helpers (text, media, catalogue)
├── utils/
│   ├── phoneUtils.js          # whatsapp:+254... <-> 254... conversions
│   └── session.js             # in-memory pending-order store (swap for Redis)
├── data/
│   └── products.js            # your product catalogue
└── .env.example
```
