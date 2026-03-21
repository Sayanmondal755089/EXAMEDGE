import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";
import { connectRedis } from "./config/redis.js";

// ✅ Routes
import authRoutes from "./routes/auth.js";
import articleRoutes from "./routes/articles.js";
import paymentRoutes from "./routes/payment.js";
import quizRoutes from "./routes/quiz.js";
import userRoutes from "./routes/user.js";
import otpRoutes from "./routes/otp.js";

// ── __dirname fix ─────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ── CONNECT DB (IMPORTANT FIX) ────────────
await connectDB();
await connectRedis();

// ── MIDDLEWARE ───────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

// ── API LOGGER ───────────────────────────
app.use("/api", (req, res, next) => {
  console.log("🔥 API Hit:", req.method, req.originalUrl);
  next();
});

// ── ROUTES ───────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/user", userRoutes);
app.use("/api/otp", otpRoutes);

// ── CHECK USER ───────────────────────────
app.get("/api/check-user", (req, res) => {
  const identifier =
    req.query.email || req.query.mobile || req.query.identifier;

  if (!identifier) {
    return res.json({ user_found: false, identifier: "" });
  }

  return res.json({ user_found: true, identifier });
});

// ── HEALTH CHECK ─────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── STATIC FILES (IMPORTANT POSITION FIX) ─
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ── START SERVER ─────────────────────────
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
});

// ── CRON JOBS ────────────────────────────
if (process.env.NODE_ENV === "production") {
  import("./pipeline/cron.js")
    .then(() => console.log("⏰ Cron jobs active"))
    .catch((err) => console.error("Cron error:", err.message));
}

// ── FRONTEND FALLBACK (⚠️ ALWAYS LAST) ────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// ── EXPORT ───────────────────────────────
export default app;
