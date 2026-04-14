// ─── models/User.js ──────────────────────────────────────────────────────────
// Defines the shape of a User document in MongoDB.
// password is optional because Google-login users don't have one.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String },          // Only for email/password signup
    googleId: { type: String },          // Only for Google login users
  },
  { timestamps: true }                   // Adds createdAt and updatedAt automatically
)

module.exports = mongoose.model('User', userSchema)
