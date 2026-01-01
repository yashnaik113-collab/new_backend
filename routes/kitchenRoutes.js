const express = require("express");
const router = express.Router();
const {
  createKitchen,
  getKitchens,
  getKitchenById,
  updateKitchen,
  deleteKitchen,
} = require("../controllers/kitchenController");

const validateTokenHandler = require("../middlewares/validateTokenHandler");
router.use(validateTokenHandler);

router.route("/").get(getKitchens);

router.route("/").post(createKitchen);

router.route("/:id").get(getKitchenById);

router.route("/:id").put(updateKitchen);

router.route("/:id").delete(deleteKitchen);

module.exports = router;
