const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const validateTokenHandler = require("../middlewares/validateTokenHandler");

const router = express.Router();

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// Forgot / Reset Password (Public — no token required)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected
router.get("/current", validateTokenHandler, currentUser);

module.exports = router;
