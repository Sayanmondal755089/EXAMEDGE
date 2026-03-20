const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question:    { type: String, required: true },
  options:     [{ type: String }],      // always 4 options
  correctIndex:{ type: Number, required: true },
  explanation: { type: String },
}, { _id: false });

const articleSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  sourceUrl:   { type: String },
  sourceName:  { type: String },
  urlHash:     { type: String, unique: true },   // MD5 of URL for dedup
  publishedAt: { type: Date },
  fetchedAt:   { type: Date, default: Date.now },

  category: {
    type: String,
    enum: ['technology', 'economy', 'current_affairs', 'science', 'international'],
    default: 'current_affairs',
  },

  examRelevance: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },

  content: {
    originalText: { type: String, maxlength: 3000 },
    summary:      { type: String },
    keyPoints:    [{ type: String }],
  },

  quizzes: [quizSchema],

  isFree:       { type: Boolean, default: false },
  aiProcessed:  { type: Boolean, default: false },
  aiProcessedAt:{ type: Date },

}, { timestamps: true });

// ── INDEXES ───────────────────────────────────────────────────────────────────
articleSchema.index({ urlHash: 1 }, { unique: true });
articleSchema.index({ fetchedAt: -1, category: 1 });
articleSchema.index({ isFree: 1, fetchedAt: -1 });
articleSchema.index({ aiProcessed: 1, fetchedAt: -1 });

module.exports = mongoose.model('Article', articleSchema);
