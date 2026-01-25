import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Dashboard from "../models/Dashboard.js";
import Roadmap from "../models/Roadmap.js";
import Query from "../models/Query.js";
import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";

const router = express.Router();

// ✅ Signup (issue token, do not auto-create roadmap/dashboard)
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username: String(username).trim(), email: normalizedEmail, password: hashedPassword });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // New users are encouraged to start by uploading a document
    res.status(201).json({
      message: "User created successfully",
      token,
      user: { _id: user._id, username: user.username, email: user.email },
      nextPage: "/upload",
    });

  } catch (err) {
    next(err);
  }
});

// ✅ Login with Passport Local (respond with nextPage based on roadmap existence)
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, async (err, user, info) => {
    try {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Check if the user has already created any learning content
      const [hasRoadmap, hasQuiz, hasFlashcard] = await Promise.all([
        Roadmap.exists({ userId: user._id }),
        Quiz.exists({ userId: user._id }),
        Flashcard.exists({ userId: user._id }),
      ]);

      // First‑time or content‑less users are guided to upload a document
      let nextPage = "/upload";
      if (hasRoadmap) {
        nextPage = "/dashboard";
      } else if (!hasQuiz && !hasFlashcard) {
        nextPage = "/upload";
      } else {
        nextPage = "/query-form";
      }

      return res.json({
        message: "Login successful",
        token,
        user: { _id: user._id, username: user.username, email: user.email },
        nextPage,
      });
    } catch (e) {
      next(e);
    }
  })(req, res, next);
});

// ✅ Forgot Password
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = String(email).trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    // Dev-friendly fallbacks
    if (!user && process.env.NODE_ENV !== 'production') {
      const rawTrimmed = String(email).trim();
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Case-insensitive exact match
      user = await User.findOne({ email: new RegExp(`^${escapeRegex(rawTrimmed)}$`, 'i') });
      // Collation-based lookup (case-insensitive)
      if (!user) {
        user = await User.findOne({ email: rawTrimmed }).collation({ locale: 'en', strength: 2 });
      }
    }
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        return res.status(404).json({ message: "Email not registered" });
      }
      return res.status(200).json({ message: "If the email exists, a reset link was sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:8081"}/reset-password/${token}`;

    if (process.env.SMTP_HOST) {
      const port = Number(process.env.SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        // In dev or when explicitly opted-in, allow self-signed certificates
        tls: (process.env.NODE_ENV !== 'production' || process.env.SMTP_TLS_INSECURE === 'true') ? { rejectUnauthorized: false } : undefined,
      });

      // Verify SMTP configuration in dev
      if (process.env.NODE_ENV !== 'production') {
        try { await transporter.verify(); } catch (e) { console.error('SMTP verify failed:', e); }
      }

      const from = process.env.SMTP_FROM || 'SkillSculptor <no-reply@skillsculptor.com>';
      const subject = 'Reset your SkillSculptor password';
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
          <h2>Reset your password</h2>
          <p>We received a request to reset your SkillSculptor password.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:6px">Set new password</a></p>
          <p>Or copy this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you didn't request this, you can ignore this email.</p>
        </div>`;

      try {
        await transporter.sendMail({ from, to: email, subject, text: `Reset your password: ${resetUrl}`, html });
      } catch (sendErr) {
        console.error('SMTP send failed:', sendErr);
        if (process.env.NODE_ENV !== 'production') {
          // In dev, still allow proceeding with the link even if email send fails
          return res.status(200).json({ message: 'Email delivery failed (dev) — use resetUrl below', resetUrl, detail: String(sendErr) });
        }
      }
    } else {
      console.log('Password reset link:', resetUrl);
    }

    const echoAllowed = process.env.PASSWORD_RESET_ECHO === 'true' || process.env.NODE_ENV !== 'production';
    const responseBody = echoAllowed
      ? { message: "If the email exists, a reset link was sent", resetUrl }
      : { message: "If the email exists, a reset link was sent" };

    res.json(responseBody);
  } catch (err) {
    next(err);
  }
});

// ✅ Reset Password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
