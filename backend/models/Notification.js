const mongoose = require("mongoose");

// Module 11 - Notification system
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "new_gig_posted",
        "proposal_received",
        "proposal_accepted",
        "proposal_rejected",
        "payment_received",
        "review_added",
        "message_received",
        "dispute_update",
        "account_status",
      ],
      required: true,
    },
    title: String,
    message: String,
    link: String, // frontend route to deep-link to
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
