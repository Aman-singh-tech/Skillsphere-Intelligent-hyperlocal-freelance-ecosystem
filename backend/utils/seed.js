/**
 * Run with: npm run seed
 * Populates the database with demo users, gigs, and proposals
 * so you have something to show on 22 July without manual data entry.
 */
require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Gig = require("../models/Gig");

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Gig.deleteMany({})]);

  const admin = await User.create({
    name: "Admin User",
    email: "admin@skillsphere.app",
    password: "Password123!",
    role: "admin",
    isEmailVerified: true,
    accountStatus: "active",
  });

  const client = await User.create({
    name: "TechVentures Pvt Ltd",
    email: "client@skillsphere.app",
    password: "Password123!",
    role: "client",
    isEmailVerified: true,
    accountStatus: "active",
    location: { city: "Bengaluru", state: "KA" },
    clientProfile: { companyName: "TechVentures Pvt Ltd", industry: "SaaS" },
  });

  const freelancer = await User.create({
    name: "Priya Sharma",
    email: "priya@skillsphere.app",
    password: "Password123!",
    role: "freelancer",
    isEmailVerified: true,
    accountStatus: "active",
    location: { city: "Bengaluru", state: "KA" },
    freelancerProfile: {
      title: "Full-Stack React Developer",
      skills: [
        { name: "React", proficiency: "Expert" },
        { name: "Node.js", proficiency: "Advanced" },
        { name: "MongoDB", proficiency: "Advanced" },
      ],
      hourlyRate: 2400,
      verificationBadge: "top_rated",
      reputationScore: 92,
      totalReviews: 14,
    },
  });

  await Gig.create({
    client: client._id,
    title: "Build React Dashboard with Analytics",
    description: "Need a full-stack dashboard with charts, auth, and REST API integration.",
    category: "Web Dev",
    skillsRequired: ["React", "Node.js", "MongoDB"],
    budgetType: "fixed",
    budgetMin: 70000,
    budgetMax: 85000,
    location: { city: "Bengaluru", isRemote: true },
    urgency: "high",
    approvalStatus: "approved",
  });

  console.log("✅ Seeded demo data:");
  console.log("   Admin:      admin@skillsphere.app / Password123!");
  console.log("   Client:     client@skillsphere.app / Password123!");
  console.log("   Freelancer: priya@skillsphere.app / Password123!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
