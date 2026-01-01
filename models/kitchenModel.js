const mongoose = require("mongoose");

const kitchenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    openingHours: {
      type: String,
      default: "",
    }, // simple string, e.g. "09:00-22:00"
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      }, // [lng, lat]
    },
  },
  { timestamps: true }
);

kitchenSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Kitchen", kitchenSchema);
