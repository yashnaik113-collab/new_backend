const express = require("express");

const validateTokenHandler = require("../middlewares/validateTokenHandler");
const {
  registerAdminUser,
  loginAdminUser,
  currentAdminUser,
  forgotAdminPassword,
  resetAdminPassword,
  addFood,
} = require("../controllers/adminController");
const upload = require("../middlewares/upload");

const router = express.Router();

// Auth
router.post("/register", registerAdminUser);
router.post("/login", loginAdminUser);

// Forgot / Reset Password (Public — no token required)
router.post("/forgot-password", forgotAdminPassword);
router.post("/reset-password/:token", resetAdminPassword);

// Protected
router.get("/current", validateTokenHandler, currentAdminUser);

// Food Management (Admin only)
// Note: foodImages are base64 strings inside JSON body — no Multer needed
router.post(
  "/food",
  validateTokenHandler,
  upload.array("foodImages", 10),
  addFood,
);

module.exports = router;
