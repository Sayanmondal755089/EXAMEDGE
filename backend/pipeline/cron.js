import cron from "node-cron";
import { runDailyPipeline } from "./runPipeline.js";

// 6:00 AM IST
cron.schedule(
  "30 0 * * *",
  async () => {
    console.log("\n⏰ [CRON] 6:00 AM IST — Starting daily pipeline...");
    try {
      await runDailyPipeline();
    } catch (err) {
      console.error("[CRON] Pipeline failed:", err.message);
    }
  },
  { timezone: "Asia/Kolkata" }
);

console.log("⏰ Cron registered: daily pipeline at 6:00 AM IST");
