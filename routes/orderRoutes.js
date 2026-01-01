const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");

const validateTokenHandler = require("../middlewares/validateTokenHandler");
router.use(validateTokenHandler);

router.route("/").post(createOrder);

router.route("/").get(getOrders);

router.route("/:id").get(getOrderById);

router.route("/:id/status").put(updateOrderStatus);

module.exports = router;
