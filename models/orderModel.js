const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    name: {
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
        name: String,
        price: Number,
      },
    ],
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: { type: [orderItemSchema], required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    address: { type: String, required: true },
    phone: { type: String, default: "" },
    status: {
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
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    kitchenId: { type: mongoose.Schema.Types.ObjectId, ref: "Kitchen" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
