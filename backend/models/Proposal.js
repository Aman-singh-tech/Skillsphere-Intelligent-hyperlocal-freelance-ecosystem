const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    coverLetter: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    estimatedDays: { type: Number, required: true },

    // Negotiation thread (Client can negotiate price)
    negotiationHistory: [
      {
        by: { type: String, enum: ["client", "freelancer"] },
        proposedAmount: Number,
        message: String,
        at: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["submitted", "under_review", "accepted", "rejected", "withdrawn"],
      default: "submitted",
    },

    matchScore: Number, // filled in by the AI matching engine (Module 2)
  },
  { timestamps: true }
);

proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model("Proposal", proposalSchema);
