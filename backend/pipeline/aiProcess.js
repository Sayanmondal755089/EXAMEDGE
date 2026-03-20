import Anthropic from "@anthropic-ai/sdk";
import Article from "../models/Article.js";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 1200;

function buildPrompt(article) {
  return `You are an expert content creator for Indian government exam preparation (UPSC, SSC, Banking, Railways).

Article title: ${article.title}
Source: ${article.sourceName}
Text: ${(article.content?.originalText || '').slice(0, 1500)}

Respond ONLY with valid JSON — no markdown, no extra text, no explanation outside the JSON:
{
  "summary": "3-4 sentence plain English summary, exam-relevant, simple language",
  "keyPoints": [
    "Specific fact 1 with numbers/dates where available",
    "Specific fact 2",
    "Specific fact 3",
    "Specific fact 4"
  ],
  "examRelevance": "high",
  "quizzes": [
    {
      "question": "Exam-pattern MCQ — specific and factual",
      "options": ["A) Option 1","B) Option 2","C) Option 3","D) Option 4"],
      "correctIndex": 1,
      "explanation": "One sentence explanation why this answer is correct"
    },
    {
      "question": "Second MCQ testing a different fact from the article",
      "options": ["A) Option 1","B) Option 2","C) Option 3","D) Option 4"],
      "correctIndex": 0,
      "explanation": "One sentence explanation why this answer is correct"
    }
  ]
}

Rules:
- examRelevance must be "high", "medium", or "low"
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Make MCQs factual and specific — not vague
- keyPoints must start with a specific fact (name, number, date, acronym)`;
}

async function processArticles(articles) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[AI] ANTHROPIC_API_KEY not set — skipping AI processing');
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('[AI] No articles to process');
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log(`[AI] Processing ${articles.length} articles in batches of ${BATCH_SIZE}...`);

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (article) => {
        try {
          const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 900,
            messages: [{ role: 'user', content: buildPrompt(article) }],
          });

          const raw = response.content[0].text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(raw);

          // Validate structure
          if (!parsed.summary || !Array.isArray(parsed.keyPoints) || !Array.isArray(parsed.quizzes)) {
            throw new Error('Invalid AI response structure');
          }

          await Article.findByIdAndUpdate(article._id, {
            'content.summary': parsed.summary,
            'content.keyPoints': parsed.keyPoints.slice(0, 5),
            examRelevance: ['high', 'medium', 'low'].includes(parsed.examRelevance)
              ? parsed.examRelevance
              : 'medium',
            quizzes: parsed.quizzes.slice(0, 3).map((q) => ({
              question: q.question,
              options: q.options.slice(0, 4),
              correctIndex: Math.min(Math.max(parseInt(q.correctIndex), 0), 3),
              explanation: q.explanation || '',
            })),
            aiProcessed: true,
            aiProcessedAt: new Date(),
          });

          processed++;
          console.log(`[AI] ✓ ${article.title.slice(0, 60)}...`);
        } catch (err) {
          failed++;
          console.error(`[AI] ✗ ${article.title.slice(0, 40)}... — ${err.message}`);
        }
      })
    );

    // Rate limit delay
    if (i + BATCH_SIZE < articles.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  console.log(`[AI] Done. Processed: ${processed}, Failed: ${failed}`);
}

// ✅ EXPORT
export { processArticles };
