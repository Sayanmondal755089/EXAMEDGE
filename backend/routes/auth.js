import express from "express";
import User from "../models/User.js";
import { generateTokens, requireAuth } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import axios from "axios";

const router = express.Router();

// ── SEND OTP ─────────────────────────────────────────────
router.post("/send-otp", async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Phone or email required" });
    }

    const isEmail = identifier.includes("@");
    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    let user = await User.findOne(query);

    if (!user) {
      user = await User.create({
        ...query,
        role: "free",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };

    await user.save();

    console.log(`\n📱 OTP for ${identifier}: ${otp}\n`);

    if (process.env.MSG91_API_KEY && !isEmail) {
      await sendSMSOTP(identifier, otp);
    }

    res.json({
      success: true,
      message: `OTP sent to ${identifier}`,
      ...(process.env.NODE_ENV !== "production" && { devOtp: otp }),
    });
  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ── VERIFY OTP ───────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: "identifier and otp required" });
    }

    const isEmail = identifier.includes("@");
    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(query);

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.otp?.code) return res.status(400).json({ error: "No OTP requested" });
    if (user.otp.expiresAt < new Date()) return res.status(400).json({ error: "OTP expired" });
    if (user.otp.code !== otp) return res.status(400).json({ error: "Incorrect OTP" });

    user.otp = undefined;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: user.toSafeJSON(),
      needsPayment: !user.isPremium(),
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── REFRESH TOKEN ────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken required" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    const tokens = generateTokens(user._id);

    res.json({ ...tokens, user: user.toSafeJSON() });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ── GET CURRENT USER ─────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  await req.user.updateStreak();
  res.json({ user: req.user.toSafeJSON() });
});

// ── HELPER ───────────────────────────────────────────────
async function sendSMSOTP(phone, otp) {
  try {
    await axios.post("https://api.msg91.com/api/v5/otp", {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: phone,
      authkey: process.env.MSG91_API_KEY,
      otp,
    });
  } catch (err) {
    console.warn("SMS send failed:", err.message);
  }
}

// ✅ VERY IMPORTANT
export default router;
