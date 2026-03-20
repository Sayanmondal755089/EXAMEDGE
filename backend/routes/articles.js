const router = require('express').Router();
const Article = require('../models/Article');
const { requireAuth, requirePremium } = require('../middleware/auth');
const redis = require('../config/redis');

// ── FREE: Today's headlines (no auth) ─────────────────────────────────────────
// GET /api/articles/headlines
router.get('/headlines', async (req, res) => {
  try {
    const cacheKey = 'feed:free';
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const articles = await Article
      .find({ isFree: true })
      .sort({ fetchedAt: -1 })
      .limit(3)
      .select('title sourceName category examRelevance publishedAt fetchedAt');

    await redis.setex(cacheKey, 3600, JSON.stringify(articles));
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch headlines' });
  }
});

// ── PREMIUM: Full feed ────────────────────────────────────────────────────────
// GET /api/articles/feed?category=economy&page=1&limit=20
router.get('/feed', requireAuth, requirePremium, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cacheKey = `feed:${today.toISOString().split('T')[0]}:${category || 'all'}:${page}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const filter = {
      aiProcessed: true,
      fetchedAt: { $gte: today },
    };
    if (category && category !== 'all') filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ examRelevance: 1, fetchedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-content.originalText'),
      Article.countDocuments(filter),
    ]);

    const result = { articles, total, page: parseInt(page), pages: Math.ceil(total / limit) };
    await redis.setex(cacheKey, 3600, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    console.error('feed error:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// ── PREMIUM: Single article ───────────────────────────────────────────────────
// GET /api/articles/:id
router.get('/:id', requireAuth, requirePremium, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).select('-content.originalText');
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

module.exports = router;
