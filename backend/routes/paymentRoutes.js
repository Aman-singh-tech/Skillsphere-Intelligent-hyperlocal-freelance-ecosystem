const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const payment = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", protect, authorize("client"), payment.createOrder);
router.post("/verify", protect, payment.verifyPayment);
router.put("/:id/release", protect, authorize("client"), payment.releasePayment);
router.put("/:id/refund", protect, payment.refundPayment);
router.get("/history", protect, payment.getTransactionHistory);

module.exports = router;
