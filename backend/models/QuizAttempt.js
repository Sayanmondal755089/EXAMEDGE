const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  articleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  questionIndex: { type: Number, required: true },
  selectedIndex: { type: Number, required: true },
  isCorrect:     { type: Boolean, required: true },
  attemptedAt:   { type: Date, default: Date.now },
}, { timestamps: false });

quizAttemptSchema.index({ userId: 1, attemptedAt: -1 });
quizAttemptSchema.index({ userId: 1, articleId: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
