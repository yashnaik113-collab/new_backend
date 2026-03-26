const express = require("express");

const validateTokenHandler = require("../middlewares/validateTokenHandler");
const {
  registerAdminUser,
  loginAdminUser,
  currentAdminUser,
  forgotAdminPassword,
  resetAdminPassword,
} = require("../controllers/adminController");

const router = express.Router();

// Auth
router.post("/register", registerAdminUser);
router.post("/login", loginAdminUser);

// Forgot / Reset Password (Public — no token required)
router.post("/forgot-password", forgotAdminPassword);
router.post("/reset-password/:token", resetAdminPassword);

// Protected
router.get("/current", validateTokenHandler, currentAdminUser);

module.exports = router;
