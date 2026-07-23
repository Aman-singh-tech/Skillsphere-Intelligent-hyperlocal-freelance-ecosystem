const Dispute = require("../models/Dispute");
const Gig = require("../models/Gig");
const Payment = require("../models/Payment");

// Module 13 - Dispute resolution system
exports.raiseDispute = async (req, res, next) => {
  try {
    const { gigId, reason, description, evidenceUrls } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

    const isClient = String(gig.client) === String(req.user._id);
    const isFreelancer = String(gig.assignedFreelancer) === String(req.user._id);
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: "Not part of this gig" });
    }

    const against = isClient ? gig.assignedFreelancer : gig.client;
    const payment = await Payment.findOne({ gig: gigId, status: "escrow_held" });

    const dispute = await Dispute.create({
      gig: gigId,
      payment: payment?._id,
      raisedBy: req.user._id,
      against,
      reason,
      description,
      evidenceUrls,
    });

    gig.status = "disputed";
    await gig.save();
    if (payment) {
      payment.status = "disputed";
      await payment.save();
    }

    res.status(201).json({ success: true, dispute });
  } catch (err) {
    next(err);
  }
};

exports.getMyDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ raisedBy: req.user._id }, { against: req.user._id }],
    }).populate("gig raisedBy against");
    res.json({ success: true, disputes });
  } catch (err) {
    next(err);
  }
};
