// ─── models/Message.js ───────────────────────────────────────────────────────
// Schema for chat messages between a user and their PT.
// workoutSnapshot is optional — it holds a formatted text summary of
// that day's workouts if the user chooses to include it.
// workoutTodo allows PTs to send actionable prescriptions directly in chat.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    fromUser:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:            { type: String, required: true },
    workoutSnapshot: { type: String, default: '' },  // e.g. "Bench Press 4x10 @ 80kg\n..."
    
    // 🚨 NEW: Actionable Prescription Data 🚨
    workoutTodo: {
      title: String,
      sets: Number,
      reps: Number,
      weight: Number,
      category: String,
      notes: String
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Message', messageSchema)