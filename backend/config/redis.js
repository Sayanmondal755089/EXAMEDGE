import { createClient } from "redis";

let client = null;
let redisEnabled = false;

// ── CONNECT REDIS ─────────────────────────
export async function connectRedis() {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.log("ℹ️ Redis not configured — caching disabled");
    return;
  }

  try {
    client = createClient({ url });

    client.on("error", (err) => {
      console.warn("⚠️ Redis error:", err.message);
    });

    client.on("connect", () => {
      console.log("🔄 Redis connecting...");
    });

    client.on("ready", () => {
      console.log("✅ Redis ready");
    });

    await client.connect();
    redisEnabled = true;

    console.log("🚀 Redis connected:", url);
  } catch (err) {
    console.warn("⚠️ Redis unavailable:", err.message);
    redisEnabled = false;
  }
}

// ── SAFE WRAPPERS ─────────────────────────
export async function get(key) {
  if (!redisEnabled || !client) return null;
  try {
    return await client.get(key);
  } catch (err) {
    console.warn("Redis GET error:", err.message);
    return null;
  }
}

export async function setex(key, seconds, value) {
  if (!redisEnabled || !client) return;
  try {
    await client.setEx(key, seconds, value);
  } catch (err) {
    console.warn("Redis SETEX error:", err.message);
  }
}

export async function del(key) {
  if (!redisEnabled || !client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.warn("Redis DEL error:", err.message);
  }
}

// ── OPTIONAL: CHECK STATUS ─────────────────
export function isRedisConnected() {
  return redisEnabled;
}

// ── DEFAULT EXPORT (🔥 FIX FOR YOUR ERROR)
export default {
  connectRedis,
  get,
  setex,
  del,
  isRedisConnected
};
