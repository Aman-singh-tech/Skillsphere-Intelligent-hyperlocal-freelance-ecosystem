const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// List/browse freelancers publicly (used by Marketplace) — Module 4/10
exports.listFreelancers = async (req, res, next) => {
  try {
    const { skill, city, minRating, maxRate } = req.query;
    const query = { role: "freelancer" };
    if (skill) query["freelancerProfile.skills.name"] = new RegExp(skill, "i");
    if (city) query["location.city"] = new RegExp(city, "i");
    if (minRating) query["freelancerProfile.reputationScore"] = { $gte: Number(minRating) * 20 }; // 5-star scale -> /100
    if (maxRate) query["freelancerProfile.hourlyRate"] = { $lte: Number(maxRate) };

    const freelancers = await User.find(query).limit(60);
    res.json({ success: true, freelancers: freelancers.map((f) => f.toSafeJSON()) });
  } catch (err) {
    next(err);
  }
};

// Get any public profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Increment profile views for freelancers (Module 15 analytics)
    if (user.role === "freelancer" && String(req.user?._id) !== String(user._id)) {
      user.freelancerProfile.profileViews += 1;
      await user.save();
    }

    res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

// Update own profile (freelancer or client fields depending on role)
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedTopLevel = ["name", "bio", "phone", "avatarUrl", "location"];
    const updates = {};
    for (const key of allowedTopLevel) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (req.user.role === "freelancer" && req.body.freelancerProfile) {
      for (const [k, v] of Object.entries(req.body.freelancerProfile)) {
        // prevent client-writable fields from overwriting server-computed ones
        if (["reputationScore", "totalReviews", "totalEarnings", "jobsCompleted", "profileViews"].includes(k)) continue;
        updates[`freelancerProfile.${k}`] = v;
      }
    }
    if (req.user.role === "client" && req.body.clientProfile) {
      for (const [k, v] of Object.entries(req.body.clientProfile)) {
        if (["gigsPosted", "totalSpent"].includes(k)) continue;
        updates[`clientProfile.${k}`] = v;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

// Upload avatar / resume / portfolio image (multipart -> Cloudinary)
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `skillsphere/${req.user._id}`, resource_type: "auto" },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    next(err);
  }
};

// Freelancer availability scheduler (Module 12)
exports.updateAvailability = async (req, res, next) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ success: false, message: "Only freelancers have an availability calendar" });
    }
    req.user.freelancerProfile.availability = req.body.slots || [];
    await req.user.save();
    res.json({ success: true, availability: req.user.freelancerProfile.availability });
  } catch (err) {
    next(err);
  }
};

// Analytics dashboard for freelancers (Module 15)
exports.getFreelancerAnalytics = async (req, res, next) => {
  try {
    const Proposal = require("../models/Proposal");
    const Review = require("../models/Review");

    const user = req.user;
    const applications = await Proposal.countDocuments({ freelancer: user._id });
    const reviews = await Review.find({ reviewee: user._id }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      analytics: {
        profileViews: user.freelancerProfile.profileViews,
        gigApplications: applications,
        totalEarnings: user.freelancerProfile.totalEarnings,
        jobsCompleted: user.freelancerProfile.jobsCompleted,
        reputationScore: user.freelancerProfile.reputationScore,
        recentReviews: reviews,
      },
    });
  } catch (err) {
    next(err);
  }
};
