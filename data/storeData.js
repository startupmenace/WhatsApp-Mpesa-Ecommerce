const fs = require("fs");
const path = require("path");

const { PRODUCTS } = require("../products");

const dataFile = path.join(__dirname, "storeData.json");

function defaultState() {
  return {
    products: PRODUCTS.map((product) => ({ ...product })),
    orders: [],
    transactions: [],
  };
}

function ensureStateFile() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultState(), null, 2));
  }

  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.products) parsed.products = defaultState().products;
    if (!Array.isArray(parsed.orders)) parsed.orders = [];
    if (!Array.isArray(parsed.transactions)) parsed.transactions = [];
    return parsed;
  } catch (error) {
    const fallback = defaultState();
    fs.writeFileSync(dataFile, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

let state = ensureStateFile();

function saveState() {
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));
}

function getProducts() {
  return state.products;
}

function getProductById(id) {
  const numericId = Number(id);
  return state.products.find((product) => product.id === numericId) || null;
}

function setProducts(products) {
  state.products = products;
  saveState();
}

function addOrder(order) {
  state.orders.unshift(order);
  saveState();
  return order;
}

function getOrders() {
  return state.orders;
}

function addTransaction(transaction) {
  state.transactions.unshift(transaction);
  saveState();
  return transaction;
}

function getTransactions() {
  return state.transactions;
}

module.exports = {
  getProducts,
  getProductById,
  setProducts,
  addOrder,
  getOrders,
  addTransaction,
  getTransactions,
};
