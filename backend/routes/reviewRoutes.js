const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const review = require("../controllers/reviewController");

const router = express.Router();

router.post("/", protect, review.createReview);
router.get("/user/:userId", review.getReviewsForUser);
router.put("/:id/flag", protect, authorize("admin"), review.adminFlagReview);

module.exports = router;
