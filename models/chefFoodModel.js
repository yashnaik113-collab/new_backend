const mongoose = require("mongoose");

const chefFoodSchema = new mongoose.Schema(
  {
    chef_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
    },

    hotelname: {
      type: String,
      required: true,
      trim: true,
    },

    foodname: {
      type: String,
      required: true,
      trim: true,
    },

    actualPrice: {
      type: Number,
      required: true,
      min: 1,
    },

    discountedPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ["veg", "non-veg", "beverages", "snacks", "dessert", "other"],
    },

    specialDish: {
      type: Boolean,
      default: false,
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

    addons: [
      {
        name: String,
        price: Number,
      },
    ],
  },

  { timestamps: true }
);

module.exports = mongoose.model("ChefFood", chefFoodSchema);
