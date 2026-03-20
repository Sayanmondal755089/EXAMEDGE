let client = null;
let redisEnabled = false;

async function connectRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('ℹ️  Redis not configured — caching disabled (set REDIS_URL in .env to enable)');
    return;
  }
  try {
    const { createClient } = require('redis');
    client = createClient({ url });
    client.on('error', (err) => console.warn('⚠️  Redis error:', err.message));
    await client.connect();
    redisEnabled = true;
    console.log('✅ Redis connected:', url);
  } catch (err) {
    console.warn('⚠️  Redis unavailable — caching disabled:', err.message);
    redisEnabled = false;
  }
}

// Safe wrappers — these NEVER throw, they just return null if Redis is down
async function get(key) {
  if (!redisEnabled || !client) return null;
  try { return await client.get(key); } catch { return null; }
}

async function setex(key, seconds, value) {
  if (!redisEnabled || !client) return;
  try { await client.setEx(key, seconds, value); } catch {}
}

async function del(key) {
  if (!redisEnabled || !client) return;
  try { await client.del(key); } catch {}
}

module.exports = { connectRedis, get, setex, del };
