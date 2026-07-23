const Gig = require("../models/Gig");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { rankFreelancersForGig } = require("../utils/aiMatch");

// Module 4 — Client creates a gig
exports.createGig = async (req, res, next) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ success: false, message: "Only clients can post gigs" });
    }

    const gig = await Gig.create({
      ...req.body,
      client: req.user._id,
      approvalStatus: "pending", // Module 9: admin approves gigs
    });

    req.user.clientProfile.gigsPosted += 1;
    await req.user.save();

    res.status(201).json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

exports.getGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ status: "open", approvalStatus: "approved" })
      .populate("client", "name clientProfile.companyName avatarUrl")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, count: gigs.length, gigs });
  } catch (err) {
    next(err);
  }
};

// Client's own gigs, regardless of approval/status — for their dashboard
exports.getMyGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, gigs });
  } catch (err) {
    next(err);
  }
};

exports.getGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id).populate("client assignedFreelancer");
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

exports.updateGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (String(gig.client) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your gig" });
    }
    Object.assign(gig, req.body);
    await gig.save();
    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

// Module 14 — Project Progress Tracker: freelancer updates their own milestone progress
exports.updateMilestoneProgress = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (String(gig.assignedFreelancer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not assigned to this gig" });
    }

    const milestone = gig.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: "Milestone not found" });

    if (req.body.progressPercent !== undefined) {
      milestone.progressPercent = Math.max(0, Math.min(100, Number(req.body.progressPercent)));
    }
    if (req.body.status) {
      milestone.status = req.body.status;
    }
    await gig.save();

    await Notification.create({
      user: gig.client,
      type: "account_status",
      title: "Milestone updated",
      message: `${req.user.name} updated progress on "${milestone.title}"`,
      link: `/gigs/${gig._id}`,
    });

    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

exports.inviteFreelancer = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (String(gig.client) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your gig" });
    }

    gig.invitedFreelancers.addToSet(req.body.freelancerId);
    await gig.save();

    await Notification.create({
      user: req.body.freelancerId,
      type: "new_gig_posted",
      title: "You've been invited to a gig",
      message: `${req.user.name} invited you to apply for "${gig.title}"`,
      link: `/gigs/${gig._id}`,
    });

    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

// Module 2 — AI-powered recommendations: "client posts a job, we recommend top freelancers"
exports.getRecommendedFreelancers = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

    const candidates = await User.find({
      role: "freelancer",
      "freelancerProfile.skills.name": { $in: gig.skillsRequired },
    }).limit(50);

    const ranked = await rankFreelancersForGig(gig, candidates);

    res.json({
      success: true,
      recommendations: ranked.slice(0, 10).map((r) => ({
        freelancer: {
          _id: r.freelancer._id,
          name: r.freelancer.name,
          title: r.freelancer.freelancerProfile.title,
          skills: r.freelancer.freelancerProfile.skills,
          reputationScore: r.freelancer.freelancerProfile.reputationScore,
          avatarUrl: r.freelancer.avatarUrl,
          location: r.freelancer.location,
        },
        matchScore: r.matchScore,
        finalScore: Math.round(r.finalScore),
      })),
    });
  } catch (err) {
    next(err);
  }
};

// Module 10 — Advanced search engine
exports.searchGigs = async (req, res, next) => {
  try {
    const { q, city, skill, minBudget, maxBudget, type } = req.query;
    const filter = { status: "open", approvalStatus: "approved" };

    if (q) filter.$text = { $search: q };
    if (city) filter["location.city"] = new RegExp(`^${city}$`, "i");
    if (skill) filter.skillsRequired = new RegExp(skill, "i");
    if (type) filter.budgetType = type;
    if (minBudget || maxBudget) {
      filter.budgetMax = {};
      if (minBudget) filter.budgetMax.$gte = Number(minBudget);
      if (maxBudget) filter.budgetMin = { $lte: Number(maxBudget) };
    }

    const gigs = await Gig.find(filter).limit(50).sort({ createdAt: -1 });
    res.json({ success: true, count: gigs.length, gigs });
  } catch (err) {
    next(err);
  }
};

exports.searchFreelancers = async (req, res, next) => {
  try {
    const { skill, city, minRating, maxRate } = req.query;
    const filter = { role: "freelancer" };

    if (skill) filter["freelancerProfile.skills.name"] = new RegExp(skill, "i");
    if (city) filter["location.city"] = new RegExp(`^${city}$`, "i");
    if (minRating) filter["freelancerProfile.reputationScore"] = { $gte: Number(minRating) * 20 }; // 5-star -> /100
    if (maxRate) filter["freelancerProfile.hourlyRate"] = { $lte: Number(maxRate) };

    const freelancers = await User.find(filter).limit(50);
    res.json({ success: true, count: freelancers.length, freelancers });
  } catch (err) {
    next(err);
  }
};
