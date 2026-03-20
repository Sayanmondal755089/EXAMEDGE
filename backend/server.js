import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";
import { connectRedis } from "./config/redis.js";

// ✅ Routes import
import authRoutes from "./routes/auth.js";
import articleRoutes from "./routes/articles.js";
import paymentRoutes from "./routes/payment.js";
import quizRoutes from "./routes/quiz.js";
import userRoutes from "./routes/user.js";

// ✅ __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ── CONNECT DB ─────────────────────────────
connectDB();
connectRedis();

// ── MIDDLEWARE ─────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// ── STATIC FILES ───────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ── ROUTES ─────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);

// ── HEALTH CHECK ───────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── FRONTEND FALLBACK ──────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── START SERVER ───────────────────────────
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`\n✅ ExamEdge server running on http://localhost:${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV}`);
  console.log(`   DB:  ${process.env.MONGODB_URI?.split('@')[1] || 'localhost'}\n`);
});

// ── CRON JOBS ──────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const cronJobs = await import("./pipeline/cron.js");
  console.log('⏰ Cron jobs active (6:00 AM IST daily)');
}

// ❌ REMOVE THIS LINE (ESM me nahi chahiye)
// module.exports = app;
export default app;
