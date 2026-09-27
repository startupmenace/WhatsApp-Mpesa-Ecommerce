const express = require("express");

const { getPendingOrder, clearPendingOrder } = require("./session");
const { sendText } = require("./whatsappService");
const { addTransaction, addOrder } = require("./data/storeData");

const router = express.Router();

/**
 * Pulls a named value out of Daraja's CallbackMetadata.Item array.
 * Each item looks like: { Name: "Amount", Value: 150 }
 */
function getMetadataValue(items, name) {
  const item = (items || []).find((i) => i.Name === name);
  return item ? item.Value : null;
}

router.post("/stk-callback", async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      console.warn("Received /stk-callback with unexpected shape:", req.body);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = callback;
    const pendingOrder = getPendingOrder(CheckoutRequestID);

    if (!pendingOrder) {
      // Nothing we can do without knowing who to message — but we must
      // still ack Safaricom so it doesn't retry.
      console.warn(
        `No pending order found for CheckoutRequestID ${CheckoutRequestID}`
      );
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { phone, product } = pendingOrder;

    if (ResultCode === 0) {
      const items = callback.CallbackMetadata?.Item;
      const amount = getMetadataValue(items, "Amount");
      const receipt = getMetadataValue(items, "MpesaReceiptNumber");

      await sendText(
        phone,
        `✅ Payment received!\n\n` +
          `Product: *${product.name}*\n` +
          `Amount: KES ${amount}\n` +
          `M-Pesa Receipt: *${receipt}*\n\n` +
          `Thank you for your purchase! 🎉`
      );
      // Record transaction and mark order as paid in our store
      try {
        addTransaction({
          mpesaReceiptNumber: receipt,
          resultDesc: ResultDesc,
          amount,
          customerPhone: phone,
          productId: product.id,
          productName: product.name,
          createdAt: Date.now(),
        });

        addOrder({
          id: Date.now(),
          productId: product.id,
          productName: product.name,
          amount,
          customerPhone: phone,
          status: 'paid',
          createdAt: Date.now(),
        });
      } catch (e) {
        console.warn('Failed to persist transaction/order:', e && e.message ? e.message : e);
      }
    } else {
      // ResultCode 1032 = cancelled by user, 1037 = timeout, etc.
      await sendText(
        phone,
        `❌ Payment for *${product.name}* was not completed (${ResultDesc}).\n` +
          `Reply *BUY ${product.id}* to try again.`
      );
    }

    clearPendingOrder(CheckoutRequestID);

    // Safaricom just needs a 200 + this shape acknowledging receipt.
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("Error in /stk-callback:", err.response?.data || err.message);
    // Still return 200 — Safaricom will retry the callback repeatedly
    // otherwise, and the failure here is on our side, not theirs.
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

module.exports = router;
