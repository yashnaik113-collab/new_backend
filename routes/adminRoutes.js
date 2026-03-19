const express = require("express");

const validateTokenHandler = require("../middlewares/validateTokenHandler");
const {
  registerAdminUser,
  loginAdminUser,
  currentAdminUser,
} = require("../controllers/adminController");

const router = express.Router();

// Auth
router.post("/register", registerAdminUser);

router.post("/login", loginAdminUser);

// Users
router.get("/current", validateTokenHandler, currentAdminUser);

module.exports = router;
