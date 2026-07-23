require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const passport = require("./config/passport");
const errorHandler = require("./middleware/errorHandler");
const { initSocket } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

// Determine allowed origins (filter out undefined)
const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean);
// If no origins provided, fallback to localhost for development
if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:5173", "http://localhost:5174");
}

// ── Socket.IO (Module 6, 11) ─────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
initSocket(io);
// Make io available to controllers if they need to emit directly
app.set("io", io);

// ── Security middleware (Week 4: "Security improvements") ───────────────
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // strips $/., prevents NoSQL injection
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(passport.initialize());

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/gigs", require("./routes/gigRoutes"));
app.use("/api/proposals", require("./routes/proposalRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/disputes", require("./routes/disputeRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.get("/api/health", (req, res) => res.json({ success: true, message: "SkillSphere API is running" }));

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 SkillSphere API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});

module.exports = { app, server, io };
