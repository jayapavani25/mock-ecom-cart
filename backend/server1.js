// backend/server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");


const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, "db.json");

// Helper: load or init db file
function loadDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    const init = { products: [
      { id: 1, name: "Headphones", price: 1200 },
      { id: 2, name: "Keyboard", price: 800 },
      { id: 3, name: "Mouse", price: 500 },
      { id: 4, name: "Monitor", price: 7000 },
      { id: 5, name: "Webcam", price: 2000 }
    ], cart: []};
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
    return init;
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Load DB on startup
let db = loadDB();

// GET /api/products
app.get("/api/products", (req, res) => {
  const products = [
    { id: 1, name: "Headphones", price: 1200, image: "/images/headphones.jpg" },
    { id: 2, name: "Keyboard", price: 800, image: "/images/keyboard.jpg" },
    { id: 3, name: "Mouse", price: 500, image: "/images/mouse.jpg" },
    { id: 4, name: "Monitor", price: 7000, image: "/images/monitor.jpg" },
    { id: 5, name: "Webcam", price: 2000, image: "/images/webcam.jpg" }
  ];
  res.json(products);
});


// POST /api/cart -> { productId, qty }
app.post("/api/cart", (req, res) => {
  const { productId, qty } = req.body;
  if (typeof productId !== "number" || typeof qty !== "number" || qty === 0)
 {
    return res.status(400).json({ error: "productId (number) and qty (positive number) required" });
  }
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const existing = db.cart.find(item => item.id === productId);
  if (existing) {
  existing.qty += qty;
  if (existing.qty <= 0) {
    db.cart = db.cart.filter(item => item.id !== productId);
  }
} else if (qty > 0) {
  db.cart.push({ id: product.id, name: product.name, price: product.price, qty });
}

  saveDB(db);
  return res.json(db.cart);
});

// DELETE /api/cart/:id  (id is product id)
// DELETE /api/cart/:id  (id is product id)
app.delete("/api/cart/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Find the item in db.cart
    const index = db.cart.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ message: "Item not found" });

    // Remove it from the array
    db.cart.splice(index, 1);

    // Save back to db.json
    saveDB(db);

    res.json({ message: "Item removed", cart: db.cart });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





// GET /api/cart -> { cart, total }
app.get("/api/cart", (req, res) => {
  const total = db.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return res.json({ cart: db.cart, total });
});

// POST /api/checkout -> { cartItems } returns mock receipt
app.post("/api/checkout", (req, res) => {
  const { cartItems, name, email } = req.body;

  // basic validation
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: "cartItems array required" });
  }
  const total = cartItems.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const timestamp = new Date().toISOString();

  // Mock receipt
  const receipt = {
    message: "Checkout successful",
    customer: { name: name || "Guest", email: email || null },
    total,
    timestamp,
    items: cartItems
  };

  // Clear server cart (simulation of checkout)
  db.cart = [];
  saveDB(db);

  return res.json(receipt);
});

// Optional: reset (dev only) - remove before submitting if you want
app.post("/api/reset", (req, res) => {
  db.cart = [];
  saveDB(db);
  res.json({ ok: true });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Backend running on http://localhost:${port}`);
});
