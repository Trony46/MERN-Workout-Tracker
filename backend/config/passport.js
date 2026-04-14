// ─── config/passport.js ──────────────────────────────────────────────────────
// Sets up Google OAuth login using Passport.js.
// When a user logs in with Google, this function runs and either finds
// the existing user in our DB or creates a new one.
// ─────────────────────────────────────────────────────────────────────────────

const passport       = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User           = require('../models/User')

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  'http://localhost:5000/api/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    // Check if user already exists in our database
    let user = await User.findOne({ googleId: profile.id })

    if (!user) {
      // First time Google login → create new user
      user = await User.create({
        name:     profile.displayName,
        email:    profile.emails[0].value,
        googleId: profile.id,
      })
    }

    // Pass user to the route handler
    return done(null, user)
  }
))

module.exports = passport
