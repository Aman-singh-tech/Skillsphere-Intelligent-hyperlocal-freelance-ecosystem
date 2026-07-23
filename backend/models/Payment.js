const mongoose = require("mongoose");

// Module 7 - Secure payment system (Razorpay), escrow + milestones
const paymentSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
    milestoneId: mongoose.Schema.Types.ObjectId,
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    amount: { type: Number, required: true }, // in INR
    platformFee: { type: Number, default: 0 },
    freelancerPayout: Number,

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    status: {
      type: String,
      enum: ["created", "escrow_held", "released", "refunded", "failed", "disputed"],
      default: "created",
    },

    refundReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
