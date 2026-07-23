const mongoose = require("mongoose");

// Module 9 - Admin dashboard audit trail
const adminLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: [
        "suspend_user",
        "reinstate_user",
        "verify_freelancer",
        "approve_gig",
        "reject_gig",
        "resolve_dispute",
        "flag_review",
      ],
      required: true,
    },
    targetType: { type: String, enum: ["User", "Gig", "Review", "Dispute"] },
    targetId: mongoose.Schema.Types.ObjectId,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminLog", adminLogSchema);
