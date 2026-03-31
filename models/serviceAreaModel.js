const mongoose = require("mongoose");

const serviceAreaSchema = new mongoose.Schema(
  {
    pincode: {
      type: Number,
      required: true,
      unique: true,
    },
    areaName: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("ServiceArea", serviceAreaSchema);
