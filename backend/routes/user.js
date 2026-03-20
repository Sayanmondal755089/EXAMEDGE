const router = require('express').Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// ── BOOKMARKS ─────────────────────────────────────────────────────────────────
// GET /api/user/bookmarks
router.get('/bookmarks', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      select: '-content.originalText',
    });
    res.json(user.bookmarks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// POST /api/user/bookmarks/:articleId
router.post('/bookmarks/:articleId', requireAuth, async (req, res) => {
  try {
    const { articleId } = req.params;
    const user = req.user;
    const alreadyBookmarked = user.bookmarks.some(id => id.toString() === articleId);
    if (alreadyBookmarked) return res.json({ bookmarked: true, message: 'Already bookmarked' });
    user.bookmarks.push(articleId);
    await user.save();
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bookmark' });
  }
});

// DELETE /api/user/bookmarks/:articleId
router.delete('/bookmarks/:articleId', requireAuth, async (req, res) => {
  try {
    req.user.bookmarks = req.user.bookmarks.filter(id => id.toString() !== req.params.articleId);
    await req.user.save();
    res.json({ bookmarked: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

// ── PROFILE ───────────────────────────────────────────────────────────────────
// PATCH /api/user/profile
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (name) req.user.name = name.trim();
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
