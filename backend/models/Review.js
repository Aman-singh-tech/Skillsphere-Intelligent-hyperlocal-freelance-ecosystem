const mongoose = require("mongoose");

// Module 8 - Smart reputation & review system
const reviewSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    rating: { type: Number, min: 1, max: 5, required: true },
    // Weighted sub-ratings feed the weighted reputation score
    communicationRating: { type: Number, min: 1, max: 5 },
    qualityRating: { type: Number, min: 1, max: 5 },
    timelinessRating: { type: Number, min: 1, max: 5 },

    comment: String,

    isVerified: { type: Boolean, default: true }, // true only if tied to a completed, paid gig
    flaggedAsFraud: { type: Boolean, default: false },
    fraudCheckReason: String,
  },
  { timestamps: true }
);

reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ gig: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
