const asyncHandler = require("express-async-handler");
const ServiceArea = require("../models/serviceAreaModel");

// ─────────────────────────────────────────────
// desc    Check if pincode is serviceable
// route   POST /api/service/check-pincode
// access  Public
// ─────────────────────────────────────────────
const checkPincode = asyncHandler(async (req, res) => {
  const { pincode } = req.body;

  if (!pincode) {
    return res.status(400).json({ message: "Please provide a pincode" });
  }

  // Parse to number just in case
  const numericPincode = Number(pincode);

  if (isNaN(numericPincode)) {
    return res.status(400).json({ message: "Invalid pincode format" });
  }

  const serviceArea = await ServiceArea.findOne({ pincode: numericPincode });

  if (serviceArea && serviceArea.isActive) {
    return res.status(200).json({
      serviceAvailable: true,
      message: "Great! We deliver delicious dabba meals in your area.",
    });
  } else {
    return res.status(200).json({
      serviceAvailable: false,
      message: "We will be coming to your area soon. Stay tuned!",
    });
  }
});

module.exports = {
  checkPincode,
};
