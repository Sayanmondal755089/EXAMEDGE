import express from "express";
import User from "../models/User.js";
import { generateTokens, requireAuth } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import fetch from "node-fetch";

const router = express.Router();

// ── SEND OTP ─────────────────────────────────────────────
router.post("/send-otp", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: "Phone required" });
    }

    const isEmail = identifier.includes("@");
    if (isEmail) {
      return res.status(400).json({ error: "Use phone number for OTP" });
    }

    // 👉 User create/find
    let user = await User.findOne({ phone: identifier });
    if (!user) {
      user = await User.create({
        phone: identifier,
        role: "free"
      });
    }

    // 🔥 MSG91 send OTP
    const response = await axios.post(
      "https://control.msg91.com/api/v5/otp",
      {
        mobile: identifier,
        template_id: process.env.MSG91_TEMPLATE_ID
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      success: true,
      message: "OTP sent successfully",
      requestId: response.data.request_id
    });

  } catch (err) {
    console.error("MSG91 send error:", err.response?.data || err.message);
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

    const response = await fetch("https://control.msg91.com/api/v5/otp/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mobile: identifier,
        otp: otp,
        authkey: process.env.MSG91_AUTH_KEY
      })
    });

    const data = await response.json();

    if (data.type !== "success") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // ✅ OTP verified → ab user check karo
    const isEmail = identifier.includes("@");
    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    let user = await User.findOne(query);

    // 👉 Agar user nahi hai → create karo
    if (!user) {
      user = await User.create({
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: user.toSafeJSON(),
      needsPayment: !user.isPremium(),
    });

  } catch (err) {
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
