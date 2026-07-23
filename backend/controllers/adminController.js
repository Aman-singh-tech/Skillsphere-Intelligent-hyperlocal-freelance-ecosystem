const User = require("../models/User");
const Gig = require("../models/Gig");
const Payment = require("../models/Payment");
const AdminLog = require("../models/AdminLog");
const Dispute = require("../models/Dispute");

async function logAction(adminId, action, targetType, targetId, notes) {
  await AdminLog.create({ admin: adminId, action, targetType, targetId, notes });
}

// ── User management ────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status === "suspended") filter.isSuspended = true;
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

exports.suspendUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true, suspensionReason: req.body.reason },
      { new: true }
    );
    await logAction(req.user._id, "suspend_user", "User", user._id, req.body.reason);
    res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

exports.reinstateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false, suspensionReason: undefined },
      { new: true }
    );
    await logAction(req.user._id, "reinstate_user", "User", user._id);
    res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

exports.verifyFreelancer = async (req, res, next) => {
  try {
    const badge = req.body.badge || "verified"; // 'verified' | 'top_rated' | 'rising_star'
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { "freelancerProfile.verificationBadge": badge },
      { new: true }
    );
    await logAction(req.user._id, "verify_freelancer", "User", user._id, badge);
    res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

// ── Gig moderation ──────────────────────────────────────────────────────
exports.getPendingGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ approvalStatus: "pending" }).populate("client", "name email");
    res.json({ success: true, count: gigs.length, gigs });
  } catch (err) {
    next(err);
  }
};

exports.approveGig = async (req, res, next) => {
  try {
    const gig = await Gig.findByIdAndUpdate(req.params.id, { approvalStatus: "approved" }, { new: true });
    await logAction(req.user._id, "approve_gig", "Gig", gig._id);
    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

exports.rejectGig = async (req, res, next) => {
  try {
    const gig = await Gig.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: "rejected", status: "cancelled" },
      { new: true }
    );
    await logAction(req.user._id, "reject_gig", "Gig", gig._id, req.body.reason);
    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

// ── Disputes (Module 13) ────────────────────────────────────────────────
exports.getDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find({ status: { $in: ["open", "under_review"] } })
      .populate("gig raisedBy against");
    res.json({ success: true, count: disputes.length, disputes });
  } catch (err) {
    next(err);
  }
};

exports.resolveDispute = async (req, res, next) => {
  try {
    const { resolution, adminNotes } = req.body; // resolution: resolved_favor_client | resolved_favor_freelancer | resolved_split
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status: resolution, adminNotes, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    await logAction(req.user._id, "resolve_dispute", "Dispute", dispute._id, resolution);
    res.json({ success: true, dispute });
  } catch (err) {
    next(err);
  }
};

// ── Analytics dashboard (Module 9) ──────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalFreelancers, totalClients, activeGigs, completedGigs, payments] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "freelancer" }),
        User.countDocuments({ role: "client" }),
        Gig.countDocuments({ status: { $in: ["open", "in_progress"] } }),
        Gig.countDocuments({ status: "completed" }),
        Payment.find({ status: "released" }),
      ]);

    const platformRevenue = payments.reduce((sum, p) => sum + p.platformFee, 0);
    const totalPayouts = payments.reduce((sum, p) => sum + p.freelancerPayout, 0);

    const topCategories = await Gig.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const totalGigsEver = activeGigs + completedGigs;
    const jobSuccessRate = totalGigsEver > 0 ? Math.round((completedGigs / totalGigsEver) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalFreelancers,
        totalClients,
        activeGigs,
        completedGigs,
        platformRevenue,
        totalPayouts,
        jobSuccessRate,
        topCategories,
      },
    });
  } catch (err) {
    next(err);
  }
};
