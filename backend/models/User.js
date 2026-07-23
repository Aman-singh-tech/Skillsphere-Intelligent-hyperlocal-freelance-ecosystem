const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    proficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
  },
  { _id: false }
);

const portfolioItemSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    imageUrl: String,
    projectUrl: String,
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: String,
    company: String,
    startDate: Date,
    endDate: Date,
    description: String,
  },
  { _id: false }
);

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    startTime: String, // "09:00"
    endTime: String, // "17:00"
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, minlength: 8, select: false }, // absent for OAuth-only users
    googleId: { type: String, select: false },

    role: {
      type: String,
      enum: ["client", "freelancer", "admin"],
      required: true,
      default: "client",
    },

    // ── Verification / security (Module 1) ──────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },

    accountStatus: {
      type: String,
      enum: ["active", "suspended", "pending_verification"],
      default: "pending_verification",
    },

    // ── Common profile fields ────────────────────────────────
    avatarUrl: String,
    location: {
      city: String,
      state: String,
      country: { type: String, default: "India" },
      coordinates: { lat: Number, lng: Number }, // for hyperlocal search
    },
    bio: { type: String, maxlength: 1000 },
    phone: String,

    // ── Freelancer-only profile fields (Module 3) ────────────
    freelancerProfile: {
      title: String, // e.g. "Full-Stack React Developer"
      skills: [skillSchema],
      portfolio: [portfolioItemSchema],
      resumeUrl: String,
      certifications: [String],
      experience: [experienceSchema],
      availability: [availabilitySlotSchema],
      hourlyRate: Number,
      milestonePricingEnabled: { type: Boolean, default: true },
      verificationBadge: {
        type: String,
        enum: ["none", "verified", "top_rated", "rising_star"],
        default: "none",
      },
      // Smart reputation (Module 8)
      reputationScore: { type: Number, default: 0 }, // weighted 0-100
      totalReviews: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      jobsCompleted: { type: Number, default: 0 },
      profileViews: { type: Number, default: 0 },
    },

    // ── Client-only profile fields ───────────────────────────
    clientProfile: {
      companyName: String,
      industry: String,
      gigsPosted: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },

    // ── Admin moderation (Module 9) ──────────────────────────
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,
  },
  { timestamps: true }
);

userSchema.index({ "freelancerProfile.skills.name": 1 });
userSchema.index({ "location.city": 1 });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
