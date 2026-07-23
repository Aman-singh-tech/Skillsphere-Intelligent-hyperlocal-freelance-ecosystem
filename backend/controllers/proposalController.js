const Proposal = require("../models/Proposal");
const Gig = require("../models/Gig");
const Notification = require("../models/Notification");
const { computeMatchScore } = require("../utils/aiMatch");

// Freelancer submits a proposal
exports.submitProposal = async (req, res, next) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ success: false, message: "Only freelancers can submit proposals" });
    }
    const gig = await Gig.findById(req.body.gigId);
    if (!gig || gig.status !== "open") {
      return res.status(400).json({ success: false, message: "Gig is not open for proposals" });
    }

    const matchScore = await computeMatchScore(gig, req.user);

    const proposal = await Proposal.create({
      gig: gig._id,
      freelancer: req.user._id,
      coverLetter: req.body.coverLetter,
      bidAmount: req.body.bidAmount,
      estimatedDays: req.body.estimatedDays,
      matchScore,
    });

    gig.proposalsCount += 1;
    await gig.save();

    await Notification.create({
      user: gig.client,
      type: "proposal_received",
      title: "New proposal received",
      message: `${req.user.name} submitted a proposal for "${gig.title}"`,
      link: `/gigs/${gig._id}/proposals`,
    });

    res.status(201).json({ success: true, proposal });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "You already applied to this gig" });
    }
    next(err);
  }
};

exports.getProposalsForGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (String(gig.client) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const proposals = await Proposal.find({ gig: req.params.gigId })
      .populate("freelancer", "name avatarUrl freelancerProfile location")
      .sort({ matchScore: -1 });

    res.json({ success: true, count: proposals.length, proposals });
  } catch (err) {
    next(err);
  }
};

exports.getMyProposals = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate({ path: "gig", populate: { path: "client", select: "name avatarUrl" } })
      .sort({ createdAt: -1 });
    res.json({ success: true, proposals });
  } catch (err) {
    next(err);
  }
};

// Client negotiates price on a proposal
exports.negotiateProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate("gig");
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
    if (String(proposal.gig.client) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    proposal.negotiationHistory.push({
      by: "client",
      proposedAmount: req.body.proposedAmount,
      message: req.body.message,
    });
    proposal.status = "under_review";
    await proposal.save();

    await Notification.create({
      user: proposal.freelancer,
      type: "proposal_accepted",
      title: "Client countered your proposal",
      message: `New offer: ₹${req.body.proposedAmount}`,
      link: `/proposals/${proposal._id}`,
    });

    res.json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};

// Client accepts a proposal -> assigns freelancer, gig moves to in_progress
exports.acceptProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate("gig");
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
    if (String(proposal.gig.client) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    proposal.status = "accepted";
    await proposal.save();

    const gig = await Gig.findById(proposal.gig._id);
    gig.assignedFreelancer = proposal.freelancer;
    gig.status = "in_progress";
    await gig.save();

    await Proposal.updateMany(
      { gig: gig._id, _id: { $ne: proposal._id } },
      { status: "rejected" }
    );

    await Notification.create({
      user: proposal.freelancer,
      type: "proposal_accepted",
      title: "Your proposal was accepted! 🎉",
      message: `You've been assigned to "${gig.title}"`,
      link: `/gigs/${gig._id}`,
    });

    res.json({ success: true, proposal, gig });
  } catch (err) {
    next(err);
  }
};

exports.rejectProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate("gig");
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });
    if (String(proposal.gig.client) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    proposal.status = "rejected";
    await proposal.save();
    res.json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};
