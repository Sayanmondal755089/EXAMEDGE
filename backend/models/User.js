import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name:         { type: String, trim: true },
  email:        { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone:        { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String },
  role:         { type: String, enum: ['free', 'premium'], default: 'free' },

  subscription: {
    status:       { type: String, enum: ['active', 'expired', 'never'], default: 'never' },
    razorpayOrderId:   String,
    razorpayPaymentId: String,
    startDate:    Date,
    endDate:      Date,
  },

  streak: {
    current:        { type: Number, default: 0 },
    longest:        { type: Number, default: 0 },
    lastActiveDate: { type: Date },
  },

  bookmarks:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],

  otp: {
    code:      String,
    expiresAt: Date,
  },

}, { timestamps: true });

// ── INDEXES ───────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// ── METHODS ───────────────────────────────────────────────────
userSchema.methods.isPremium = function () {
  return this.role === 'premium' &&
    this.subscription.status === 'active' &&
    this.subscription.endDate > new Date();
};

userSchema.methods.updateStreak = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = this.streak.lastActiveDate;

  if (last) {
    const lastDay = new Date(last);
    lastDay.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

    if (diff === 0) return;
    if (diff === 1) {
      this.streak.current += 1;
    } else {
      this.streak.current = 1;
    }
  } else {
    this.streak.current = 1;
  }

  this.streak.longest = Math.max(this.streak.longest, this.streak.current);
  this.streak.lastActiveDate = today;
  await this.save();
};

// Mask sensitive fields
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  return obj;
};

// ✅ EXPORT (IMPORTANT)
const User = mongoose.model("User", userSchema);
export default User;
