const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const {
  getProducts,
  setProducts,
  getOrders,
  addOrder,
  getTransactions,
  addTransaction,
} = require("./data/storeData");

const router = express.Router();
const uploadsDir = path.join(__dirname, "public", "uploads");

function isAdmin(req) {
  return req.session && req.session.isAdmin;
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const stamp = Date.now();
    cb(null, `${stamp}-${safeName}`);
  },
});

const upload = multer({ storage });

router.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Simple admin authentication endpoints
router.post('/admin/login', express.json(), (req, res) => {
  const { username, password } = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'password';

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/admin/me', (req, res) => {
  return res.json({ authenticated: !!isAdmin(req) });
});

router.get("/api/products", requireAdmin, (req, res) => {
  res.json(getProducts());
});

router.post("/api/products", requireAdmin, upload.single("image"), (req, res) => {
  const product = req.body;
  if (!product || !product.name || !product.price) {
    return res.status(400).json({ error: "Name and price are required." });
  }

  const current = getProducts();
  const nextId = current.length ? Math.max(...current.map((p) => p.id), 0) + 1 : 1;
  const imageUrl = req.file
    ? `/uploads/${req.file.filename}`
    : product.imageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

  const nextProduct = {
    id: Number(product.id) || nextId,
    name: String(product.name).trim(),
    description: String(product.description || "").trim(),
    price: Number(product.price),
    imageUrl,
  };

  const updated = product.id
    ? current.map((item) => (item.id === Number(product.id) ? { ...item, ...nextProduct } : item))
    : [...current, nextProduct];

  setProducts(updated);
  return res.status(201).json(updated);
});

router.put("/api/products/:id", requireAdmin, upload.single("image"), (req, res) => {
  const id = Number(req.params.id);
  const current = getProducts();
  const item = current.find((product) => product.id === id);

  if (!item) {
    return res.status(404).json({ error: "Product not found." });
  }

  const updated = current.map((product) =>
    product.id === id
      ? {
          ...product,
          ...req.body,
          id,
          price: Number(req.body.price || product.price),
          imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || product.imageUrl,
        }
      : product
  );

  setProducts(updated);
  return res.json(updated);
});

router.delete("/api/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const current = getProducts();
  const filtered = current.filter((product) => product.id !== id);
  setProducts(filtered);
  return res.json(filtered);
});

router.get("/api/orders", requireAdmin, (req, res) => {
  res.json(getOrders());
});

router.post("/api/orders", requireAdmin, (req, res) => {
  const order = addOrder(req.body);
  return res.status(201).json(order);
});

router.get("/api/transactions", requireAdmin, (req, res) => {
  res.json(getTransactions());
});

router.post("/api/transactions", requireAdmin, (req, res) => {
  const tx = addTransaction(req.body);
  return res.status(201).json(tx);
});

module.exports = router;
