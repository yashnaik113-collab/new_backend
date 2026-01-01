const Order = require("../models/orderModel");
const Food = require("../models/foodModel");
const asyncHandler = require("express-async-handler");

// desc create new order
// route POST /api/orders
//  * body: { userId, address, phone, items: [{ foodId, quantity }] }

const createOrder = asyncHandler(async (req, res) => {
  const { userId, address, phone = "", items } = req.body;
  if (
    !userId ||
    !address ||
    !items ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "userId, address and items are required",
    });
  }

  // Build order items and calculate total
  const orderItems = [];
  let total = 0;
  for (const it of items) {
    const food = await Food.findById(it.foodId);
    if (!food)
      return res
        .status(404)
        .json({ success: false, message: `Food not found: ${it.foodId}` });
    const qty = Number(it.quantity || 1);
    const price = Number(food.price || 0);
    const addons = it.addons || [];
    orderItems.push({
      foodId: food._id,
      name: food.name,
      price,
      quantity: qty,
      addons,
    });
    total +=
      price * qty + (addons.reduce((s, a) => s + (a.price || 0), 0) || 0);
  }
  const order = new Order({
    userId,
    items: orderItems,
    totalPrice: total,
    address,
    phone,
  });
  await order.save();
  res.status(201).json({ success: true, message: "Order placed", data: order });
});

// desc get orders
// route GET /api/orders?userId=...
const getOrders = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const filter = {};
  if (userId) filter.userId = userId;
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

// desc get order by id
// route GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, data: order });
});

// desc update order status
// route PUT /api/orders/:id/status
// body: { status }

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = [
    "placed",
    "preparing",
    "out-for-delivery",
    "delivered",
    "cancelled",
  ];
  if (!allowed.includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, message: "Order status updated", data: order });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
