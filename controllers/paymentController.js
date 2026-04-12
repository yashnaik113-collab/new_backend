const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const razorpayInstance = require("../config/razorpay");
const Order = require("../models/orderModel");

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Public
const createOrder = asyncHandler(async (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    res.status(400);
    throw new Error("Order ID and amount are required");
  }

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: "INR",
    receipt: `receipt_order_${orderId}`,
  };

  try {
    const razorpayOrder = await razorpayInstance.orders.create(options);
    
    // Update the existing order in our DB to store razorpayOrderId
    await Order.findByIdAndUpdate(orderId, {
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Something went wrong creating Razorpay order");
  }
});

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify-payment
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error("Payment verification details are missing");
  }

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Payment is verified successfully
    // Find the order that has this razorpay_order_id and update it
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    
    if (order) {
      order.paymentStatus = "success";
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } else {
    // Payment verification failed
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    
    if (order) {
      order.paymentStatus = "failed";
      await order.save();
    }

    res.status(400);
    throw new Error("Invalid payment signature");
  }
});

module.exports = {
  createOrder,
  verifyPayment,
};
