const express = require("express");
const { protect } = require("../middleware/auth");
const dispute = require("../controllers/disputeController");

const router = express.Router();
router.post("/", protect, dispute.raiseDispute);
router.get("/mine", protect, dispute.getMyDisputes);

module.exports = router;
