// ─── controllers/chatController.js ───────────────────────────────────────────
// Two things this handles:
//   1. findUser   — search for a PT by email (so user can connect to them)
//   2. getHistory — load previous messages between two users
// ─────────────────────────────────────────────────────────────────────────────

const User    = require('../models/User')
const Message = require('../models/Message')

// ── Find a user by email (to connect with PT) ──────────────────────────────
const findUser = async (req, res) => {
  const { email } = req.query

  if (!email) return res.status(400).json({ error: 'Email required' })

  // Don't let users find themselves
  const user = await User.findOne({ email, _id: { $ne: req.user._id } })
    .select('name email _id')

  if (!user) return res.status(404).json({ error: 'No user found with that email' })

  res.json(user)
}

// ── Get message history between two users ─────────────────────────────────
const getHistory = async (req, res) => {
  const { otherUserId } = req.params
  const myId = req.user._id

  // Find all messages where current user is either sender or receiver
  const messages = await Message.find({
    $or: [
      { fromUser: myId,    toUser:   otherUserId },
      { fromUser: otherUserId, toUser: myId },
    ]
  }).sort({ createdAt: 1 })   // oldest first

  res.json(messages)
}

module.exports = { findUser, getHistory }
