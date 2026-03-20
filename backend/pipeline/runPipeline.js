import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "../config/database.js";
import { fetchAndStore } from "./fetchNews.js";
import { processArticles } from "./aiProcess.js";
import Article from "../models/Article.js";
import redis from "../config/redis.js";

// __dirname fix for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

async function runDailyPipeline() {
  const startTime = Date.now();
  console.log("\n🚀 [Pipeline] Starting daily pipeline at", new Date().toLocaleString("en-IN"));

  // 1. Fetch new articles
  const newArticles = await fetchAndStore();
  if (newArticles.length === 0) {
    console.log("[Pipeline] No new articles. Checking for unprocessed existing articles...");
  }

  // 2. Process unprocessed articles
  const unprocessed = await Article.find({ aiProcessed: false }).limit(30);
  if (unprocessed.length > 0) {
    console.log(`[Pipeline] Found ${unprocessed.length} unprocessed articles`);
    await processArticles(unprocessed);
  }

  // 3. Mark free articles
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Article.updateMany({ isFree: true }, { isFree: false });

  const todayHigh = await Article
    .find({ fetchedAt: { $gte: today }, aiProcessed: true, examRelevance: "high" })
    .sort({ fetchedAt: -1 })
    .limit(3);

  const todayMedium = await Article
    .find({ fetchedAt: { $gte: today }, aiProcessed: true, examRelevance: "medium" })
    .sort({ fetchedAt: -1 })
    .limit(Math.max(0, 3 - todayHigh.length));

  const freeArticles = [...todayHigh, ...todayMedium].slice(0, 3);

  if (freeArticles.length > 0) {
    await Article.updateMany(
      { _id: { $in: freeArticles.map((a) => a._id) } },
      { isFree: true }
    );
    console.log(`[Pipeline] Marked ${freeArticles.length} articles as free`);
  }

  // 4. Clear Redis cache
  const { del } = redis;
  await del("feed:free");

  const todayStr = today.toISOString().split("T")[0];
  for (const cat of ["all","economy","technology","current_affairs","science","international"]) {
    await del(`feed:${todayStr}:${cat}:1`);
  }

  console.log("[Pipeline] Redis cache cleared");

  // 5. Summary
  const totalToday = await Article.countDocuments({
    fetchedAt: { $gte: today },
    aiProcessed: true,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ [Pipeline] Complete in ${elapsed}s — ${totalToday} articles ready for today\n`);

  return { totalToday, elapsed };
}

// ✅ ESM equivalent of require.main === module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  connectDB()
    .then(async () => {
      await redis.connectRedis?.();
      await runDailyPipeline();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Pipeline] Fatal error:", err);
      process.exit(1);
    });
}

// ✅ EXPORT
export { runDailyPipeline };
