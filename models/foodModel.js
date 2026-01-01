const mongoose = require("mongoose");
const foodSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ["veg", "non-veg", "beverages", "snacks", "dessert", "other"],
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
    },

    kitchenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kitchen",
      required: false, // keep optional until you add kitchen model
    },

    addons: [
      {
        name: String,
        price: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Food", foodSchema);
