const express = require("express");
const rateLimit = require("express-rate-limit");
const passport = require("../config/passport");
const auth = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");

const router = express.Router();

// Basic brute-force protection on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts, please try again later" },
});

router.post("/register", authLimiter, auth.register);
router.get("/verify-email/:token", auth.verifyEmail);
router.post("/login", authLimiter, auth.login);
router.post("/forgot-password", authLimiter, auth.forgotPassword);
router.post("/reset-password/:token", auth.resetPassword);

router.get("/me", protect, auth.getMe);
router.post("/2fa/setup", protect, auth.setup2FA);
router.post("/2fa/confirm", protect, auth.confirm2FA);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const accessToken = generateAccessToken(req.user._id, req.user.role);
    const refreshToken = generateRefreshToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }
);

module.exports = router;
