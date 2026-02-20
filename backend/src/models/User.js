const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['student', 'global_client'], default: 'student' },
  college_domain: { type: String, default: null },
  isCollegeVerified: { type: Boolean, default: false },
  skill_tags: { type: [String], default: [] },
  reliability_score: { type: Number, default: 0 },
  skill_tier: { type: Number, default: 1 },
  weekly_hours_completed: { type: Number, default: 0 },
  wallet_balance: { type: Number, default: 2000 },
  badges: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
