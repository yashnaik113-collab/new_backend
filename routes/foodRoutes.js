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
const upload = require("../middlewares/upload");
const multer = require("multer");
const storage = multer.memoryStorage();
// const upload = multer({ storage });

// router.use(validateTokenHandler);

router.route("/").get(getFoods);

router
  .route("/")
  .post(validateTokenHandler, upload.single("image"), createFood);

router.route("/:id").get(getFoodById);

router.route("/:id").put(validateTokenHandler, updateFood);

router.route("/:id").delete(validateTokenHandler, deleteFood);

module.exports = router;
