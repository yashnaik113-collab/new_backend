const express = require("express");

const validateTokenHandler = require("../middlewares/validateTokenHandler");
const {
  registerAdminUser,
  loginAdminUser,
  currentAdminUser,
  forgotAdminPassword,
  resetAdminPassword,
  addFood,
  getAllOrdersAdmin,
  getAdminDashboardStats,
  updateFoodAvailability,
  addPincode,
  listPincodes,
  updatePincodeStatus,
  deletePincode,
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

// Update Food Availability (Admin only)
router.patch("/food/:id/availability", validateTokenHandler, updateFoodAvailability);

// Orders Management (Admin only)
router.get("/orders", validateTokenHandler, getAllOrdersAdmin);

// Dashboard Statistics (Admin only)
router.get("/dashboard", validateTokenHandler, getAdminDashboardStats);

// ─────────────────────────────────────────────
// Pincode (Service Area) Management (Admin only)
// ─────────────────────────────────────────────
router.post("/pincode/add", validateTokenHandler, addPincode);
router.get("/pincode/list", validateTokenHandler, listPincodes);
router.patch("/pincode/:id/status", validateTokenHandler, updatePincodeStatus);
router.delete("/pincode/:id", validateTokenHandler, deletePincode);

module.exports = router;
