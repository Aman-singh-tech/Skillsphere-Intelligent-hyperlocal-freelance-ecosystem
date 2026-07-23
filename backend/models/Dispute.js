const mongoose = require("mongoose");

// Module 13 - Dispute resolution system
const disputeSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    against: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    reason: { type: String, required: true },
    description: String,
    evidenceUrls: [String],

    status: {
      type: String,
      enum: ["open", "under_review", "resolved_favor_client", "resolved_favor_freelancer", "resolved_split"],
      default: "open",
    },
    adminNotes: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
