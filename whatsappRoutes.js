const express = require("express");
const twilio = require("twilio");

const { getProducts, getProductById } = require("./data/storeData");
const { toDarajaFormat } = require("./phoneUtils");
const {
  setPendingOrder,
  setPendingProductSelection,
  getPendingProductSelection,
  clearPendingProductSelection,
} = require("./session");
const { sendCatalog } = require("./whatsappService");
const { initiateSTKPush, querySTKStatus } = require("./darajaService");

const router = express.Router();
const { MessagingResponse } = twilio.twiml;

router.post("/whatsapp", async (req, res) => {
  const from = req.body.From; // e.g. "whatsapp:+254712345678"
  const rawBody = (req.body.Body || "").trim();
  const body = rawBody.toLowerCase();

  const twiml = new MessagingResponse();

  try {
    const pendingSelection = getPendingProductSelection(from);
    if (pendingSelection) {
      const requestedPhone = toDarajaFormat(rawBody);
      if (!requestedPhone) {
        twiml.message("Please send the phone number for the M-Pesa payment.");
        return res.type("text/xml").send(twiml.toString());
      }

      const product = getProductById(pendingSelection.productId);
      if (!product) {
        clearPendingProductSelection(from);
        twiml.message(
          "Sorry, that product is no longer available. Reply *HI* to see the catalogue again."
        );
        return res.type("text/xml").send(twiml.toString());
      }

      clearPendingProductSelection(from);

      const stkResponse = await initiateSTKPush({
        phone: requestedPhone,
        amount: product.price,
        accountReference: `ORDER-${product.id}`,
        transactionDesc: product.name,
      });

      if (stkResponse.ResponseCode !== "0") {
        twiml.message(
          "Sorry, we couldn't start the M-Pesa payment right now. Please try again shortly."
        );
        return res.type("text/xml").send(twiml.toString());
      }

      try {
        const stkStatus = await querySTKStatus(stkResponse.CheckoutRequestID);
        console.log(
          `STK query for ${stkResponse.CheckoutRequestID}:`,
          stkStatus?.ResultCode,
          stkStatus?.ResultDesc
        );
      } catch (statusErr) {
        console.warn(
          "STK query failed after push for",
          stkResponse.CheckoutRequestID,
          statusErr.response?.data || statusErr.message
        );
      }

      setPendingOrder(stkResponse.CheckoutRequestID, {
        phone: from,
        product,
      });

      twiml.message(
        `📲 A payment prompt for *KES ${product.price.toLocaleString()}* ` +
          `(${product.name}) has been sent to *${requestedPhone}*. Enter your M-Pesa PIN to complete the purchase.`
      );
      return res.type("text/xml").send(twiml.toString());
    }

    if (["hi", "hello", "menu", "start"].includes(body)) {
      twiml.message(
        "👋 Welcome to Fortune Dev Store!\n\n" +
          "Here are our featured products with images, prices, and details. " +
          "Please reply with the product number you want to buy (for example: *1*)."
      );

      res.type("text/xml").send(twiml.toString());
      await sendCatalog(from, getProducts());
      return;
    }

    const productId = body.startsWith("buy")
      ? rawBody.split(/\s+/)[1]
      : /^\d+$/.test(body)
        ? body
        : null;

    if (productId) {
      const product = getProductById(productId);
      if (!product) {
        twiml.message(
          `Sorry, I couldn't find that product. Reply *MENU* to see the catalogue again, ` +
            `then reply with the product number only (for example: *2*).`
        );
        return res.type("text/xml").send(twiml.toString());
      }

      setPendingProductSelection(from, product.id);
      twiml.message(
        `You selected *${product.name}* for *KES ${product.price.toLocaleString()}*. ` +
          "Please send the phone number to pay."
      );
      return res.type("text/xml").send(twiml.toString());
    }

    twiml.message(
      'Reply *HI* to see the catalogue, then reply with the product number you want to buy (for example: *1*).'
    );
    return res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Error in /whatsapp webhook:", err.response?.data || err.message);

    // Always acknowledge Twilio with a 200, even on internal errors, so it
    // doesn't retry-storm the endpoint. Tell the user something went wrong.
    if (!res.headersSent) {
      const errorTwiml = new MessagingResponse();
      errorTwiml.message(
        "Sorry, something went wrong on our end. Please try again in a moment."
      );
      return res.type("text/xml").send(errorTwiml.toString());
    }
  }
});

module.exports = router;
