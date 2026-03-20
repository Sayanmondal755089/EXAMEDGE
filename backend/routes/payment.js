import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Lazy-load Razorpay
function getRazorpay() {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_your")
  ) {
    return null;
  }

  // dynamic import in ESM
  const Razorpay = (await import("razorpay")).default;

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ── CREATE ORDER ─────────────────────────────────────────
router.post("/create-order", requireAuth, async (req, res) => {
  const razorpay = await getRazorpay();

  // DEMO MODE
  if (!razorpay) {
    const fakeOrderId = "order_demo_" + Date.now();
    return res.json({
      orderId: fakeOrderId,
      amount: parseInt(process.env.SUBSCRIPTION_AMOUNT) || 1900,
      currency: process.env.SUBSCRIPTION_CURRENCY || "INR",
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
      demoMode: true,
    });
  }

  try {
    const amount = parseInt(process.env.SUBSCRIPTION_AMOUNT) || 1900;

    const order = await razorpay.orders.create({
      amount,
      currency: process.env.SUBSCRIPTION_CURRENCY || "INR",
      receipt: `sub_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), plan: "6months" },
    });

    req.user.subscription.razorpayOrderId = order.id;
    await req.user.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      demoMode: false,
    });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ error: "Could not create payment order" });
  }
});

// ── VERIFY PAYMENT ───────────────────────────────────────
router.post("/verify", requireAuth, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    demoMode,
  } = req.body;

  if (
    demoMode ||
    !process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET === "your_razorpay_key_secret"
  ) {
    await activateSubscription(req.user, "demo_order", "demo_payment");
    const updatedUser = await User.findById(req.user._id);
    return res.json({ success: true, user: updatedUser.toSafeJSON() });
  }

  try {
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({
        error: "Payment verification failed — invalid signature",
      });
    }

    await activateSubscription(
      req.user,
      razorpay_order_id,
      razorpay_payment_id
    );

    const updatedUser = await User.findById(req.user._id);
    res.json({ success: true, user: updatedUser.toSafeJSON() });
  } catch (err) {
    console.error("Payment verify error:", err);
    res.status(500).json({ error: "Payment verification error" });
  }
});

// ── WEBHOOK ──────────────────────────────────────────────
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const sig = req.headers["x-razorpay-signature"];
      const body = req.body.toString();

      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (sig !== expected) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const event = JSON.parse(body);

      if (event.event === "payment.captured") {
        const notes = event.payload?.payment?.entity?.notes;

        if (notes?.userId) {
          const user = await User.findById(notes.userId);

          if (user) {
            await activateSubscription(
              user,
              event.payload.payment.entity.order_id,
              event.payload.payment.entity.id
            );
          }
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// ── HELPER ───────────────────────────────────────────────
async function activateSubscription(user, orderId, paymentId) {
  const days = parseInt(process.env.SUBSCRIPTION_DAYS) || 180;

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  user.role = "premium";
  user.subscription = {
    status: "active",
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    startDate: new Date(),
    endDate,
  };

  await user.save();
  console.log(
    `✅ Premium activated for user ${user._id} until ${endDate.toDateString()}`
  );
}

// ✅ EXPORT
export default router;
