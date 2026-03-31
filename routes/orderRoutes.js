const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAdminOrders,
  getOrderById,
  updateOrderStatus,
  markPaymentSuccess,
} = require("../controllers/orderController");
const validateTokenHandler = require("../middlewares/validateTokenHandler");

// All order routes require a valid JWT
router.use(validateTokenHandler);

// ── User routes ────────────────────────────────────────────────────────
// POST /api/orders/create       — place an order from cart
router.post("/create", createOrder);

// PUT  /api/orders/payment-success/:orderId — update payment to true / success
router.put("/payment-success/:orderId", markPaymentSuccess);

// GET  /api/orders/user-orders  — logged-in user's order history
router.get("/user-orders", getUserOrders);

// ── Admin routes ───────────────────────────────────────────────────────
// GET  /api/orders/admin-orders — all orders (admin dashboard)
// Keep for backwards compatibility, but actual admin endpoints are in adminRoutes
router.get("/admin-orders", getAdminOrders);

// ── Shared routes ──────────────────────────────────────────────────────
// GET  /api/orders/:id          — single order detail
router.get("/:id", getOrderById);

// PUT  /api/orders/:id/status   — update order status (admin)
router.put("/:id/status", updateOrderStatus);

module.exports = router;
