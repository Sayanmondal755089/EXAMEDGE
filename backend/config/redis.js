import { createClient } from "redis";

let client = null;
let redisEnabled = false;

export async function connectRedis() {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.log('ℹ️ Redis not configured — caching disabled');
    return;
  }

  try {
    client = createClient({ url });

    client.on('error', (err) =>
      console.warn('⚠️ Redis error:', err.message)
    );

    await client.connect();
    redisEnabled = true;

    console.log('✅ Redis connected:', url);
  } catch (err) {
    console.warn('⚠️ Redis unavailable:', err.message);
    redisEnabled = false;
  }
}

// Safe wrappers
export async function get(key) {
  if (!redisEnabled || !client) return null;
  try { return await client.get(key); } catch { return null; }
}

export async function setex(key, seconds, value) {
  if (!redisEnabled || !client) return;
  try { await client.setEx(key, seconds, value); } catch {}
}

export async function del(key) {
  if (!redisEnabled || !client) return;
  try { await client.del(key); } catch {}
}
