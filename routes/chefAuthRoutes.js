const express = require("express");
const router = express.Router();
const {
  registerChef,
  loginChef,
  forgotChefPassword,
  resetChefPassword,
} = require("../controllers/chefAuthController");
const { protectChef } = require("../middlewares/chefAuthMiddleware");

// Register Chef
router.post("/", registerChef);

// Login Chef
router.post("/login", loginChef);

// Forgot / Reset Password
router.post("/forgot-password", forgotChefPassword);
router.post("/reset-password/:token", resetChefPassword);

module.exports = router;
