const express = require("express");
const router = express.Router();
const {
  getFoods,
  createFood,
  getFoodById,
  updateFood,
  deleteFood,
} = require("../controllers/foodController");
const validateTokenHandler = require("../middlewares/validateTokenHandler");

// router.use(validateTokenHandler);

router.route("/").get(getFoods);

router.route("/").post(validateTokenHandler, createFood);

router.route("/:id").get(getFoodById);

router.route("/:id").put(validateTokenHandler, updateFood);

router.route("/:id").delete(validateTokenHandler, deleteFood);

module.exports = router;
