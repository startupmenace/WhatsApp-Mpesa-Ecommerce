/**
 * Product catalogue.
 *
 * imageUrl MUST be a publicly reachable HTTPS URL (Twilio/WhatsApp fetch it
 * directly — they cannot see localhost files). Host images on something like
 * Cloudinary, S3 + CloudFront, Cloudinary, ImgBB, or your own CDN.
 *
 * id: what customers type after "BUY" (e.g. "BUY 1").
 * price: in KES, whole shillings (Daraja STK Push amounts must be integers).
 */
const PRODUCTS = [
  {
    id: 1,
    name: "Fortune Dev Academy - React Native Starter Kit",
    price: 1,
    description: "Boilerplate + M-Pesa Daraja module + auth flow.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    name: "WooCommerce M-Pesa Plugin (Lifetime License)",
    price: 1,
    description: "Daraja STK Push checkout plugin for WooCommerce stores.",
    imageUrl:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    name: "1-on-1 Fintech Integration Consultation (1hr)",
    price: 1,
    description: "Live session: Daraja, PalPluss, or payroll integrations.",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  },
];

function getProductById(id) {
  const numericId = Number(id);
  return PRODUCTS.find((p) => p.id === numericId) || null;
}

module.exports = { PRODUCTS, getProductById };
