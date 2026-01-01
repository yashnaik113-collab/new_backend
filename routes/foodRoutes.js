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

router.use(validateTokenHandler);

router.route("/").get(getFoods);

router.route("/").post(createFood);

router.route("/:id").get(getFoodById);

router.route("/:id").put(updateFood);

router.route("/:id").delete(deleteFood);

module.exports = router;
