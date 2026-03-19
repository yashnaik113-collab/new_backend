const express = require("express");
const router = express.Router();
const {
  registerChef,
  loginChef,
} = require("../controllers/chefAuthController");
const { protectChef } = require("../middlewares/chefAuthMiddleware");

// Register Chef
router.post("/", registerChef);

// Login Chef
router.post("/login", loginChef);

module.exports = router;
