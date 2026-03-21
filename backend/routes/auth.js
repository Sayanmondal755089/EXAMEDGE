import express from "express";
import User from "../models/User.js";
import { generateTokens, requireAuth } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import axios from "axios";

const router = express.Router();

// ── SEND OTP ───────────────────────────────
router.post("/send-otp", async (req, res) => {
  try {
    let { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: "Phone required" });
    }

    // 👉 Ensure Indian format
    if (!identifier.startsWith("91")) {
      identifier = "91" + identifier;
    }

    // 👉 Create / find user
    let user = await User.findOne({ phone: identifier });
    if (!user) {
      user = await User.create({
        phone: identifier,
        role: "free"
      });
    }

    // ✅ MSG91 SEND OTP
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
      message: "OTP sent",
      requestId: response.data.request_id
    });

  } catch (err) {
    console.error("OTP SEND ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ── VERIFY OTP ────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    let { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: "identifier & otp required" });
    }
    // 🧪 TEST USER BYPASS (Razorpay verification ke liye)
    if (identifier === "+919999999999" && otp === "1234") {
      let user = await User.findOne({ phone: identifier });

      if (!user) {
        user = await User.create({ phone: identifier });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);

      return res.json({
        success: true,
        accessToken,
        refreshToken,
        user: user.toSafeJSON(),
        needsPayment: false,
      });
    }
    if (!identifier.startsWith("91")) {
      identifier = "91" + identifier;
    }

    const response = await axios.post(
      "https://control.msg91.com/api/v5/otp/verify",
      {
        mobile: identifier,
        otp: otp
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data;

    if (data.type !== "success") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // 👉 user fetch/create
    let user = await User.findOne({ phone: identifier });

    if (!user) {
      user = await User.create({ phone: identifier });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: user.toSafeJSON(),
      needsPayment: !user.isPremium()
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ── VERIFY MSG91 WIDGET TOKEN ─────────────
// Frontend MSG91 widget success callback ke baad ye call hota hai
// Body: { identifier, token }
router.post("/verify-msg91", async (req, res) => {
  try {
    let { identifier, token } = req.body;

    if (!identifier) return res.status(400).json({ error: "identifier required" });
    if (!token)      return res.status(400).json({ error: "MSG91 token required" });

    // Indian format ensure karo
    if (!identifier.startsWith("91")) {
      identifier = "91" + identifier;
    }

    // ── Step 1: MSG91 server se token verify karo ──────────────────────────
    const msg91Res = await axios.post(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        authkey:        "502039A2TIOvFpLWCs69be67c0P1",
        "access-token": token,
      },
      {
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
      }
    );

    const msg91Data = msg91Res.data;
    console.log("[MSG91 verify]", msg91Data);

    // MSG91 success response: { "type": "success", ... }
    if (msg91Data.type !== "success") {
      return res.status(401).json({
        error: "OTP verification failed: " + (msg91Data.message || "Invalid token"),
      });
    }
    // ── Step 1 done — token genuine hai ───────────────────────────────────

    // ── Step 2: User find ya create karo ──────────────────────────────────
    let user = await User.findOne({ phone: identifier });
    if (!user) {
      user = await User.create({ phone: identifier, role: "free" });
      console.log("[Auth] New user created:", identifier);
    }

    // ── Step 3: Apna JWT issue karo ───────────────────────────────────────
    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      success:      true,
      accessToken,
      refreshToken,
      user:         user.toSafeJSON(),
      needsPayment: !user.isPremium(),
    });

  } catch (err) {
    console.error("verify-msg91 error:", err.response?.data || err.message);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── REFRESH TOKEN ─────────────────────────
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

// ── GET USER ──────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  await req.user.updateStreak();
  res.json({ user: req.user.toSafeJSON() });
});

export default router;
