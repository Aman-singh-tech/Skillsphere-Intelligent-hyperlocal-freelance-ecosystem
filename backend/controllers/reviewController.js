const Review = require("../models/Review");
const Gig = require("../models/Gig");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { recalculateReputation, fraudCheck } = require("../utils/reputationScore");

exports.createReview = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.body.gigId);
    if (!gig || gig.status !== "completed") {
      return res.status(400).json({ success: false, message: "Can only review completed gigs" });
    }

    const isClient = String(gig.client) === String(req.user._id);
    const isFreelancer = String(gig.assignedFreelancer) === String(req.user._id);
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: "Not part of this gig" });
    }

    const revieweeId = isClient ? gig.assignedFreelancer : gig.client;

    const review = await Review.create({
      gig: gig._id,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating: req.body.rating,
      communicationRating: req.body.communicationRating,
      qualityRating: req.body.qualityRating,
      timelinessRating: req.body.timelinessRating,
      comment: req.body.comment,
    });

    // Module 8 — fraud heuristic
    const { flagged, reasons } = await fraudCheck(review, gig);
    if (flagged) {
      review.flaggedAsFraud = true;
      review.fraudCheckReason = reasons.join("; ");
      await review.save();
    } else {
      // Only recalc reputation for legitimate reviews, and only for freelancer reviewees
      const reviewee = await User.findById(revieweeId);
      if (reviewee.role === "freelancer") {
        await recalculateReputation(revieweeId);
      }
    }

    await Notification.create({
      user: revieweeId,
      type: "review_added",
      title: "You received a new review",
      message: `${req.user.name} left you a ${req.body.rating}-star review`,
      link: `/profile/${revieweeId}`,
    });

    res.status(201).json({ success: true, review, flagged });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "You already reviewed this gig" });
    }
    next(err);
  }
};

exports.getReviewsForUser = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId, flaggedAsFraud: false })
      .populate("reviewer", "name avatarUrl")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    next(err);
  }
};

// Module 9 — admin flags/unflags a review as fraudulent
exports.adminFlagReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.flaggedAsFraud = req.body.flagged;
    review.fraudCheckReason = req.body.reason || review.fraudCheckReason;
    await review.save();

    const reviewee = await User.findById(review.reviewee);
    if (reviewee.role === "freelancer") await recalculateReputation(review.reviewee);

    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};
