const Review = require("../models/Review");
const User = require("../models/User");

/**
 * Module 8 — Smart Reputation & Review System
 *
 * Instead of a flat average of star ratings, this computes a weighted
 * reputation score (0-100) that factors in:
 *  - average of quality/communication/timeliness sub-ratings
 *  - review recency (recent reviews count more — decays with age)
 *  - review volume (more verified reviews -> more confidence -> higher ceiling)
 *  - a penalty for reviews flagged as fraudulent
 */
async function recalculateReputation(freelancerId) {
  const reviews = await Review.find({ reviewee: freelancerId, flaggedAsFraud: false });

  if (reviews.length === 0) {
    await User.findByIdAndUpdate(freelancerId, {
      "freelancerProfile.reputationScore": 0,
      "freelancerProfile.totalReviews": 0,
    });
    return 0;
  }

  const now = Date.now();
  let weightedSum = 0;
  let weightTotal = 0;

  for (const r of reviews) {
    const subAvg =
      ((r.communicationRating || r.rating) +
        (r.qualityRating || r.rating) +
        (r.timelinessRating || r.rating)) /
      3;

    const ageDays = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    // Recency weight: full weight for first 30 days, decays toward 0.4 floor after a year
    const recencyWeight = Math.max(0.4, 1 - ageDays / 365);

    weightedSum += subAvg * recencyWeight;
    weightTotal += recencyWeight;
  }

  const weightedAvgOutOf5 = weightedSum / weightTotal; // 0-5
  // Volume confidence factor: caps out once a freelancer has 20+ verified reviews
  const volumeFactor = Math.min(1, 0.5 + reviews.length / 40);

  const score = Math.round(((weightedAvgOutOf5 / 5) * 100) * volumeFactor);

  await User.findByIdAndUpdate(freelancerId, {
    "freelancerProfile.reputationScore": score,
    "freelancerProfile.totalReviews": reviews.length,
  });

  return score;
}

/**
 * Basic fraud-detection heuristic for a new review:
 * flags reviews that are suspiciously fast after gig assignment,
 * or where the reviewer/reviewee pair has an unusually high review velocity.
 */
async function fraudCheck(review, gig) {
  const reasons = [];

  const gigDurationMs = new Date(review.createdAt) - new Date(gig.createdAt);
  if (gigDurationMs < 1000 * 60 * 10) {
    reasons.push("Review submitted within 10 minutes of gig creation");
  }

  const recentReviewsByReviewer = await Review.countDocuments({
    reviewer: review.reviewer,
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  });
  if (recentReviewsByReviewer > 5) {
    reasons.push("Reviewer posted more than 5 reviews in 24 hours");
  }

  return { flagged: reasons.length > 0, reasons };
}

module.exports = { recalculateReputation, fraudCheck };
