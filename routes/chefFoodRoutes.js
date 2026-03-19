const express = require("express");
const router = express.Router();
const chefAuthMiddleware = require("../businessmiddleware/chefAuthMiddleware");
const {
  getChefFoods,
  createChefFood,
  getChefFoodById,
} = require("../controllers/chefFoodController");

// Get all chef foods
router.get("/", chefAuthMiddleware.protectChef, getChefFoods);

// Create new chef food
router.post("/", chefAuthMiddleware.protectChef, createChefFood);

// Get chef food by id
router.get("/:id", chefAuthMiddleware.protectChef, getChefFoodById);

module.exports = router;
