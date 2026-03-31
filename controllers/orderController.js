const Order = require("../models/orderModel");
const Food = require("../models/foodModel");
const asyncHandler = require("express-async-handler");

// ─────────────────────────────────────────────────────────────────────────────
// desc    Create a new order from cart items
// route   POST /api/orders/create
// access  Private (user token required)
// body:   { address, phone, items: [{ foodId, quantity, addons? }] }
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { address, phone = "", items } = req.body;
  const userId = req.user.id; // pulled from JWT — never trust body for this

  if (!address) {
    return res
      .status(400)
      .json({ success: false, message: "Delivery address is required" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart is empty. Please add items before placing an order",
    });
  }

  // ── Build order items & calculate total ──────────────────────────────────
  const orderItems = [];
  let totalPrice = 0;

  for (const it of items) {
    const food = await Food.findById(it.foodId);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: `Food item not found: ${it.foodId}`,
      });
    }

    if (food.isAvailable === false) {
      return res.status(400).json({
        success: false,
        message: `This item is currently unavailable: ${food.foodName || food.name}`,
      });
    }

    const qty = Number(it.quantity) || 1;
    const unitPrice = Number(food.price) || 0;
    const addons = it.addons || [];
    const addonTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
    const itemTotal = (unitPrice + addonTotal) * qty;

    orderItems.push({
      foodId: food._id,
      foodName: food.foodName || food.name,
      price: unitPrice,
      quantity: qty,
      addons: addons || [],
    });

    totalPrice += itemTotal;
  }

  // ── Save order ────────────────────────────────────────────────────────────
  const order = await Order.create({
    userId,
    items: orderItems,
    totalPrice,
    address,
    phone,
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: {
      orderId: order._id,
      userId: order.userId,
      items: order.items,
      totalPrice: order.totalPrice,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// desc    Mark payment as successful
// route   PUT /api/orders/payment-success/:orderId
// access  Private (user or payment-gateway webhook)
// ─────────────────────────────────────────────────────────────────────────────
const markPaymentSuccess = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.paymentStatus === "success") {
    return res.status(200).json({
      success: true,
      message: "Payment was already marked as successful",
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  }

  order.paymentStatus = "success";
  await order.save(); // persisted to DB — admin dashboard reflects this instantly

  res.status(200).json({
    success: true,
    message: "Payment marked as successful",
    data: {
      orderId: order._id,
      userId: order.userId,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      updatedAt: order.updatedAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// desc    Get all orders for the logged-in user
// route   GET /api/orders/user-orders
// access  Private (user token required)
// ─────────────────────────────────────────────────────────────────────────────
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// desc    Get all orders (admin view)
// route   GET /api/orders/admin-orders   (kept for backward compat)
// access  Private (admin token required)
// ─────────────────────────────────────────────────────────────────────────────
const getAdminOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("userId", "name email") // pull user name + email
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// desc    Get single order by ID
// route   GET /api/orders/:id
// access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "userId",
    "name email",
  );

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// desc    Update order status (admin)
// route   PUT /api/orders/:id/status
// access  Private (admin)
// body:   { orderStatus }
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const allowed = [
    "placed",
    "preparing",
    "out-for-delivery",
    "delivered",
    "cancelled",
  ];

  if (!orderStatus || !allowed.includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid orderStatus. Allowed values: ${allowed.join(", ")}`,
    });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus },
    { new: true },
  );

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.json({
    success: true,
    message: `Order status updated to "${orderStatus}"`,
    data: order,
  });
});

module.exports = {
  createOrder,
  markPaymentSuccess,
  getUserOrders,
  getAdminOrders,
  getOrderById,
  updateOrderStatus,
};
