const axios = require('axios');
const crypto = require('crypto');
const Article = require('../models/Article');

// ── KEYWORD-BASED CATEGORISATION (free, no AI cost) ──────────────────────────
function categorise(title, text) {
  const c = (title + ' ' + text).toLowerCase();
  if (/rbi|gdp|inflation|budget|rupee|sensex|nifty|economy|fiscal|revenue|tax|gst|trade|export|import|sebi|stock/.test(c)) return 'economy';
  if (/isro|space|ai |artificial intelligence|technology|startup|digital india|5g|semiconductor|cyber|software|app/.test(c)) return 'technology';
  if (/science|research|climate|environment|health|medicine|drug|nasa|cern/.test(c)) return 'science';
  if (/china|pakistan|us |united states|united nations|foreign|bilateral|g20|g7|un |imf|world bank|asean/.test(c)) return 'international';
  return 'current_affairs';
}

function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

// ── NEWSAPI FETCH ─────────────────────────────────────────────────────────────
async function fetchFromNewsAPI() {
  if (!process.env.NEWSAPI_KEY) return [];
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const res = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'India economy OR India technology OR UPSC OR "government scheme" OR "RBI" OR "ISRO" OR "budget India"',
        language: 'en',
        pageSize: 40,
        sortBy: 'publishedAt',
        from: yesterday,
        apiKey: process.env.NEWSAPI_KEY,
      },
      timeout: 10000,
    });
    return (res.data.articles || []).map(a => ({
      title:       a.title,
      sourceUrl:   a.url,
      sourceName:  a.source?.name || 'NewsAPI',
      publishedAt: new Date(a.publishedAt),
      originalText: `${a.description || ''} ${a.content || ''}`.trim(),
    }));
  } catch (err) {
    console.warn('[Pipeline] NewsAPI failed:', err.message);
    return [];
  }
}

// ── GNEWS FETCH ───────────────────────────────────────────────────────────────
async function fetchFromGNews() {
  if (!process.env.GNEWS_KEY) return [];
  try {
    const res = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        q: 'India',
        lang: 'en',
        country: 'in',
        max: 30,
        token: process.env.GNEWS_KEY,
      },
      timeout: 10000,
    });
    return (res.data.articles || []).map(a => ({
      title:       a.title,
      sourceUrl:   a.url,
      sourceName:  a.source?.name || 'GNews',
      publishedAt: new Date(a.publishedAt),
      originalText: a.description || '',
    }));
  } catch (err) {
    console.warn('[Pipeline] GNews failed:', err.message);
    return [];
  }
}

// ── MAIN FETCH + STORE ────────────────────────────────────────────────────────
async function fetchAndStore() {
  console.log('[Pipeline] Fetching news...');

  const [newsApiArticles, gNewsArticles] = await Promise.all([
    fetchFromNewsAPI(),
    fetchFromGNews(),
  ]);

  const all = [...newsApiArticles, ...gNewsArticles];
  console.log(`[Pipeline] Fetched ${all.length} raw articles`);

  let stored = 0;
  const newArticles = [];

  for (const a of all) {
    if (!a.title || !a.sourceUrl) continue;
    const hash = hashUrl(a.sourceUrl);

    try {
      const exists = await Article.findOne({ urlHash: hash });
      if (exists) continue;

      const doc = await Article.create({
        title:       a.title,
        sourceUrl:   a.sourceUrl,
        sourceName:  a.sourceName,
        urlHash:     hash,
        publishedAt: a.publishedAt,
        category:    categorise(a.title, a.originalText),
        content:     { originalText: a.originalText.slice(0, 2000) },
        aiProcessed: false,
      });
      newArticles.push(doc);
      stored++;
    } catch (err) {
      if (err.code !== 11000) console.warn('[Pipeline] Store error:', err.message);
    }
  }

  console.log(`[Pipeline] Stored ${stored} new articles (${all.length - stored} duplicates skipped)`);
  return newArticles;
}

module.exports = { fetchAndStore };
