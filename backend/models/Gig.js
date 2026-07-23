const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    amount: Number,
    dueDate: Date,
    status: {
      type: String,
      enum: ["pending", "in_progress", "submitted", "approved", "paid"],
      default: "pending",
    },
    progressPercent: { type: Number, default: 0 },
    fileUploads: [String], // Cloudinary URLs
  },
  { timestamps: true }
);

const gigSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    skillsRequired: [{ type: String, trim: true }],

    budgetType: { type: String, enum: ["fixed", "hourly", "milestone"], default: "fixed" },
    budgetMin: Number,
    budgetMax: Number,

    location: {
      city: String,
      state: String,
      isRemote: { type: Boolean, default: true },
      coordinates: { lat: Number, lng: Number },
    },

    attachments: [String], // Cloudinary URLs
    milestones: [milestoneSchema],

    invitedFreelancers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    status: {
      type: String,
      enum: ["draft", "open", "in_progress", "completed", "cancelled", "disputed"],
      default: "open",
    },
    // Admin approval (Module 9)
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    proposalsCount: { type: Number, default: 0 },
    urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { timestamps: true }
);

gigSchema.index({ title: "text", description: "text", skillsRequired: "text" });
gigSchema.index({ category: 1, status: 1 });
gigSchema.index({ "location.city": 1 });
gigSchema.index({ budgetMin: 1, budgetMax: 1 });

module.exports = mongoose.model("Gig", gigSchema);
