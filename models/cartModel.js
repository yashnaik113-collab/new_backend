const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
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
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    // optional: keep addons or extra info if you need later
    addons: [
      {
        name: String,
        price: Number,
      },
    ],
  },
  {
    _id: true,
  } // each item will have its own _id
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);
// Helper to recalc total before save
cartSchema.methods.recalculate = function () {
  this.totalAmount = this.items.reduce(
    (sum, it) => sum + (it.price || 0) * (it.quantity || 1),
    0
  );
};

cartSchema.pre("save", function (next) {
  this.recalculate();
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
