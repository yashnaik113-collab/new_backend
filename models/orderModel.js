const mongoose = require("mongoose");

// ── Sub-schema: individual order line item ───────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },

    foodName: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    addons: [
      {
        name: {
          type: String,
        },
        price: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { _id: false },
);

// ── Main order schema ─────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    address: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    // ── Payment lifecycle ──────────────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpaySignature: {
      type: String,
    },

    // ── Order fulfilment lifecycle ─────────────────────────────────────────
    orderStatus: {
      type: String,
      enum: [
        "placed",
        "preparing",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },

    kitchenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kitchen",
    },
  },
  { timestamps: true }, // adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("Order", orderSchema);
