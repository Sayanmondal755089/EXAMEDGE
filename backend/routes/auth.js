const router = require('express').Router();
const User = require('../models/User');
const { generateTokens, requireAuth } = require('../middleware/auth');

// ── SEND OTP ─────────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// Body: { identifier: "phone or email" }
router.post('/send-otp', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Phone or email required' });

    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };

    // Find or create user
    let user = await User.findOne(query);
    if (!user) {
      user = await User.create({
        ...query,
        role: 'free',
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
    await user.save();

    // In production: send via MSG91 or Twilio
    // For now we log to console (dev mode)
    console.log(`\n📱 OTP for ${identifier}: ${otp}\n`);

    // If MSG91 configured, send real SMS
    if (process.env.MSG91_API_KEY && !isEmail) {
      await sendSMSOTP(identifier, otp);
    }

    res.json({
      success: true,
      message: `OTP sent to ${identifier}`,
      // DEV ONLY: remove this in production!
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ── VERIFY OTP ────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Body: { identifier, otp }
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) return res.status(400).json({ error: 'identifier and otp required' });

    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };
    const user = await User.findOne(query);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.otp?.code) return res.status(400).json({ error: 'No OTP requested. Please request a new OTP.' });
    if (user.otp.expiresAt < new Date()) return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    if (user.otp.code !== otp) return res.status(400).json({ error: 'Incorrect OTP' });

    // Clear OTP
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
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Body: { refreshToken }
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const tokens = generateTokens(user._id);
    res.json({ ...tokens, user: user.toSafeJSON() });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  // Also update streak on daily visit
  await req.user.updateStreak();
  res.json({ user: req.user.toSafeJSON() });
});

// ── HELPER: Send SMS via MSG91 ────────────────────────────────────────────────
async function sendSMSOTP(phone, otp) {
  const axios = require('axios');
  try {
    await axios.post('https://api.msg91.com/api/v5/otp', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: phone,
      authkey: process.env.MSG91_API_KEY,
      otp,
    });
  } catch (err) {
    console.warn('SMS send failed (continuing):', err.message);
  }
}

module.exports = router;
