// ─── config/db.js ─────────────────────────────────────────────────────────────
// Connects our app to MongoDB using Mongoose.
// Called once when the server starts.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message)
    process.exit(1)   // Stop the server if DB fails
  }
}

module.exports = connectDB
