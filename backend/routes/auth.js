// ─── routes/auth.js ───────────────────────────────────────────────────────────
// BUG FIX: Google callback now redirects to /auth (not /) so GoogleAuthCatcher
// component can read the token BEFORE PrivateRoute checks for a user.
// Previous bug: redirected to /?token=... → PrivateRoute runs first → no user
// in context yet → redirects to /login → infinite loop.
// ─────────────────────────────────────────────────────────────────────────────

const express  = require('express')
const router   = express.Router()
const jwt      = require('jsonwebtoken')
const passport = require('../config/passport')
const { signup, login } = require('../controllers/authController')

// Email / password
router.post('/signup', signup)
router.post('/login',  login)

// Step 1: Send user to Google's login page
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

// Step 2: Google sends user back here after login
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:5173/login',
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    // KEY FIX: redirect to /auth route (not /) so the token is processed
    // before PrivateRoute checks for authentication
    const params = new URLSearchParams({
      token,
      name: req.user.name,
      _id:  req.user._id.toString(),
    })
    res.redirect(`http://localhost:5173/auth?${params.toString()}`)
  }
)

module.exports = router
