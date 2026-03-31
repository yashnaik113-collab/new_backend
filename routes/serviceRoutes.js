const express = require("express");
const { checkPincode } = require("../controllers/serviceController");

const router = express.Router();

// route   POST /api/service/check-pincode
// access  Public
router.post("/check-pincode", checkPincode);

module.exports = router;
