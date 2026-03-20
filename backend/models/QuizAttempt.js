import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  articleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  questionIndex: { type: Number, required: true },
  selectedIndex: { type: Number, required: true },
  isCorrect:     { type: Boolean, required: true },
  attemptedAt:   { type: Date, default: Date.now },
}, { timestamps: false });

// ── INDEXES ─────────────────────────────────────────
quizAttemptSchema.index({ userId: 1, attemptedAt: -1 });
quizAttemptSchema.index({ userId: 1, articleId: 1 });

// ✅ EXPORT
const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
