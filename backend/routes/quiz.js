const router = require('express').Router();
const Article = require('../models/Article');
const QuizAttempt = require('../models/QuizAttempt');
const { requireAuth, requirePremium } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

// ── SUBMIT QUIZ ANSWER ────────────────────────────────────────────────────────
// POST /api/quiz/submit
router.post('/submit', requireAuth, requirePremium, async (req, res) => {
  try {
    const { articleId, questionIndex, selectedIndex } = req.body;
    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const quiz = article.quizzes[questionIndex];
    if (!quiz) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = quiz.correctIndex === parseInt(selectedIndex);

    await QuizAttempt.create({
      userId:        req.user._id,
      articleId,
      questionIndex,
      selectedIndex: parseInt(selectedIndex),
      isCorrect,
    });

    // Update streak
    await req.user.updateStreak();

    res.json({
      isCorrect,
      correctIndex: quiz.correctIndex,
      explanation:  quiz.explanation,
    });
  } catch (err) {
    console.error('quiz submit error:', err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// ── AI GENERATE EXTRA MCQs ─────────────────────────────────────────────────
// POST /api/quiz/generate
router.post('/generate', requireAuth, requirePremium, async (req, res) => {
  try {
    const { articleId } = req.body;
    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI not configured' });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = `You are an expert for Indian government exam preparation (UPSC, SSC, Banking, Railways).

Article: ${article.title}
Summary: ${article.content.summary}

Generate 2 NEW MCQs testing different aspects than common questions.
Respond ONLY with valid JSON array — no markdown, no extra text:
[
  {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctIndex":0,"explanation":"..."},
  {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctIndex":2,"explanation":"..."}
]`;

    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const newQuizzes = JSON.parse(raw);

    res.json({ quizzes: newQuizzes });
  } catch (err) {
    console.error('quiz generate error:', err);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// ── DAILY DRILL QUESTIONS ─────────────────────────────────────────────────────
// GET /api/quiz/daily-drill
router.get('/daily-drill', requireAuth, requirePremium, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const articles = await Article.find({
      aiProcessed: true,
      fetchedAt: { $gte: today },
      'quizzes.0': { $exists: true },
    }).limit(10);

    const questions = articles.flatMap(a =>
      a.quizzes.slice(0, 1).map(q => ({
        ...q,
        articleId: a._id,
        category:  a.category,
        articleTitle: a.title,
      }))
    ).slice(0, 10);

    // Shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    res.json({ questions, total: questions.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load drill' });
  }
});

// ── STATS ─────────────────────────────────────────────────────────────────────
// GET /api/quiz/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const attempts = await QuizAttempt.find({
      userId: req.user._id,
      attemptedAt: { $gte: last7Days },
    });

    const total   = attempts.length;
    const correct = attempts.filter(a => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    res.json({
      total, correct,
      wrong:    total - correct,
      accuracy,
      streak:   req.user.streak,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

module.exports = router;
