const express = require("express");
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  getcartByUserId,
} = require("../controllers/cartController");

const validateTokenHandler = require("../middlewares/validateTokenHandler");
router.use(validateTokenHandler);

router.route("/").get(getcartByUserId);

router.route("/add").post(addItemToCart);

router.route("/update").put(updateItemQuantity);

router.route("/remove").delete(removeItemFromCart);

router.route("/clear").delete(clearCart);

module.exports = router;
