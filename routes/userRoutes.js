const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
} = require("../controllers/userController");
const validateTokenHandler = require("../middlewares/validateTokenHandler");

const router = express.Router();

// Auth
router.post("/register", registerUser);

router.post("/login", loginUser);

// Users
router.get("/current", validateTokenHandler, currentUser);

module.exports = router;
