const crypto = require("crypto");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { generateAccessToken, generateRefreshToken, generateRandomToken } = require("../utils/generateToken");

// ── Register ────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    if (!["client", "freelancer"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'client' or 'freelancer'" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const verificationToken = generateRandomToken();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      emailVerificationToken: crypto.createHash("sha256").update(verificationToken).digest("hex"),
      emailVerificationExpires: Date.now() + 1000 * 60 * 60 * 24, // 24h
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your SkillSphere account",
      html: `<p>Hi ${user.name},</p><p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>. It expires in 24 hours.</p>`,
    });

    return res.status(201).json({
      success: true,
      message: "Registered. Please check your email to verify your account.",
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ── Verify email ────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification link" });
    }

    user.isEmailVerified = true;
    user.accountStatus = "active";
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

// ── Login ───────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password, twoFactorCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +twoFactorSecret");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: "Account suspended", reason: user.suspensionReason });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ success: true, twoFactorRequired: true });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: twoFactorCode,
        window: 1,
      });
      if (!verified) {
        return res.status(401).json({ success: false, message: "Invalid 2FA code" });
      }
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ── Forgot / reset password ────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with that email address" });
    }

    const resetToken = generateRandomToken();
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = Date.now() + 1000 * 60 * 30; // 30 min
    await user.save();

    // Admins live on a separate frontend (frontend-admin) with its own
    // domain, so route their reset link there instead of the client app.
    const baseUrl =
      user.role === "admin" && process.env.ADMIN_CLIENT_URL
        ? process.env.ADMIN_CLIENT_URL
        : process.env.CLIENT_URL;

    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your SkillSphere password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
    });

    res.json({ success: true, message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
    }
    if (!req.body.password || req.body.password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful. Please log in." });
  } catch (err) {
    next(err);
  }
};

// ── Two-Factor Authentication (2FA) ────────────────────────────────────
exports.setup2FA = async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({ name: `SkillSphere (${req.user.email})` });
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, qrCodeDataUrl: qrDataUrl, manualEntryKey: secret.base32 });
  } catch (err) {
    next(err);
  }
};

exports.confirm2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+twoFactorSecret");
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: req.body.code,
      window: 1,
    });
    if (!verified) {
      return res.status(400).json({ success: false, message: "Invalid code, please try again" });
    }
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ success: true, message: "2FA enabled" });
  } catch (err) {
    next(err);
  }
};

// ── Current user ────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
};
