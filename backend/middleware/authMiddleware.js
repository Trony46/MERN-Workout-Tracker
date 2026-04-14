// ─── middleware/authMiddleware.js ─────────────────────────────────────────────
// This runs BEFORE any protected route handler.
// It checks if the request has a valid JWT token in the header.
// If yes → attaches the user to req.user and continues.
// If no  → sends back a 401 Unauthorized error.
// ─────────────────────────────────────────────────────────────────────────────

const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  // Token format: "Bearer <token>"
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token — please log in' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)  // Decode the token
    req.user = await User.findById(decoded.id).select('-password')  // Attach user (without password)
    next()  // Move on to the actual route
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { protect }
