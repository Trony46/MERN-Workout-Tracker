// ─── models/Workout.js ───────────────────────────────────────────────────────
// Defines the shape of a Workout document in MongoDB.
// Each workout belongs to a specific user (via ObjectId reference).
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose')

const workoutSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:    { type: String, required: true },          // e.g. "Bench Press"
    reps:     { type: Number, required: true },          // e.g. 12
    sets:     { type: Number, required: true },          // e.g. 3
    weight:   { type: Number, required: true },          // in kg
    category: { type: String, default: 'General' },     // e.g. "Chest", "Legs"
    notes:    { type: String, default: '' },             // optional notes
  },
  { timestamps: true }
)

module.exports = mongoose.model('Workout', workoutSchema)
