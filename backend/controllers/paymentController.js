const crypto = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Gig = require("../models/Gig");
const User = require("../models/User");
const Notification = require("../models/Notification");

const PLATFORM_FEE_PERCENT = 10; // SkillSphere takes 10%, matches "Admin analytics: platform revenue"

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("⚠️  Razorpay not configured — set RAZORPAY_KEY_ID/SECRET in .env to enable real payments.");
}

// Client funds a milestone into escrow
exports.createOrder = async (req, res, next) => {
  try {
    const { gigId, milestoneId, amount } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (String(gig.client) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
    const freelancerPayout = amount - platformFee;

    let freelancerId = gig.assignedFreelancer;
    if (!freelancerId) {
      const Proposal = require("../models/Proposal");
      const prop = await Proposal.findOne({ gig: gigId, status: { $in: ["accepted", "submitted"] } });
      if (prop) freelancerId = prop.freelancer;
    }

    const payment = await Payment.create({
      gig: gigId,
      milestoneId,
      client: req.user._id,
      freelancer: freelancerId,
      amount,
      platformFee,
      freelancerPayout,
      status: "created",
    });

    if (!razorpay) {
      // Dev-mode: simulate escrow hold without a real payment gateway
      payment.status = "escrow_held";
      payment.razorpayOrderId = `dev_order_${payment._id}`;
      await payment.save();
      return res.json({
        success: true,
        devMode: true,
        message: "Razorpay not configured — simulated escrow hold for local testing.",
        payment,
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    payment.razorpayOrderId = order.id;
    await payment.save();

    res.json({ success: true, order, paymentId: payment._id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    next(err);
  }
};

// Verify Razorpay signature after client completes checkout -> holds funds in escrow
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { razorpayPaymentId, razorpaySignature, status: "escrow_held" },
      { new: true }
    );

    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

// Client approves milestone -> release funds from escrow to freelancer (automatic payout)
exports.releasePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (String(payment.client) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    if (payment.status !== "escrow_held") {
      return res.status(400).json({ success: false, message: "Payment is not in escrow" });
    }

    payment.status = "released";
    
    let freelancerId = payment.freelancer;
    if (!freelancerId) {
      const gig = await Gig.findById(payment.gig);
      if (gig && gig.assignedFreelancer) {
        freelancerId = gig.assignedFreelancer;
      } else {
        const Proposal = require("../models/Proposal");
        const prop = await Proposal.findOne({ gig: payment.gig });
        if (prop) freelancerId = prop.freelancer;
      }
      if (freelancerId) payment.freelancer = freelancerId;
    }
    await payment.save();

    if (freelancerId) {
      await User.findByIdAndUpdate(freelancerId, {
        $inc: { "freelancerProfile.totalEarnings": payment.freelancerPayout || payment.amount },
      });
    }
    await User.findByIdAndUpdate(payment.client, {
      $inc: { "clientProfile.totalSpent": payment.amount },
    });

    const gig = await Gig.findById(payment.gig);
    if (gig && payment.milestoneId && gig.milestones) {
      const milestone = gig.milestones.id(payment.milestoneId);
      if (milestone) {
        milestone.status = "paid";
        await gig.save();
      }
    }

    if (freelancerId) {
      await Notification.create({
        user: freelancerId,
        type: "payment_received",
        title: "Payment released 💰",
        message: `₹${payment.freelancerPayout || payment.amount} has been released to you`,
        link: `/payments/${payment._id}`,
      });
    }

    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

// Refund management
exports.refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (req.user.role !== "admin" && String(payment.client) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (razorpay && payment.razorpayPaymentId) {
      await razorpay.payments.refund(payment.razorpayPaymentId, { amount: payment.amount * 100 });
    }

    payment.status = "refunded";
    payment.refundReason = req.body.reason;
    await payment.save();

    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

exports.getTransactionHistory = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "client"
        ? { client: req.user._id }
        : req.user.role === "freelancer"
        ? { freelancer: req.user._id }
        : {}; // admin sees all

    const payments = await Payment.find(filter)
      .populate("gig", "title")
      .populate("client freelancer", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
};
