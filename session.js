/**
 * Very small in-memory store used for two things:
 *
 *  1. conversations   phone -> { lastProductShown } (not strictly required
 *                      by the flow below, kept for easy extension)
 *  2. pendingOrders    CheckoutRequestID -> { phone, product, createdAt }
 *                      so that when Safaricom's callback arrives we know
 *                      which customer/product/chat it belongs to.
 *
 * IMPORTANT (production note): this is an in-process JavaScript Map. It is
 * fine for local testing and single-instance demos, but:
 *   - it is wiped on every restart/deploy
 *   - it will NOT work if you run more than one server instance
 * For production, replace this with Redis (or your DB) keyed the same way,
 * with a TTL (e.g. 10 minutes) so abandoned STK pushes get cleaned up.
 */

const pendingOrders = new Map();
const pendingProductSelections = new Map();

function setPendingOrder(checkoutRequestId, data) {
  pendingOrders.set(checkoutRequestId, { ...data, createdAt: Date.now() });
}

function getPendingOrder(checkoutRequestId) {
  return pendingOrders.get(checkoutRequestId) || null;
}

function clearPendingOrder(checkoutRequestId) {
  pendingOrders.delete(checkoutRequestId);
}

function setPendingProductSelection(phone, productId) {
  pendingProductSelections.set(phone, { productId, createdAt: Date.now() });
}

function getPendingProductSelection(phone) {
  return pendingProductSelections.get(phone) || null;
}

function clearPendingProductSelection(phone) {
  pendingProductSelections.delete(phone);
}

module.exports = {
  setPendingOrder,
  getPendingOrder,
  clearPendingOrder,
  setPendingProductSelection,
  getPendingProductSelection,
  clearPendingProductSelection,
};
