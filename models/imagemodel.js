const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      data: String, // base64 string
      contentType: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Image", imageSchema);
