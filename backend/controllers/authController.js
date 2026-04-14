// ─── controllers/authController.js ───────────────────────────────────────────
const User   = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const signup = async (req, res) => {
  const { name, email, password } = req.body
  const alreadyExists = await User.findOne({ email })
  if (alreadyExists) return res.status(400).json({ error: 'Email already registered' })
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashedPassword })
  res.status(201).json({ token: makeToken(user._id), name: user.name, email: user.email, _id: user._id })
}

const login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user || !user.password) return res.status(400).json({ error: 'Invalid email or password' })
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' })
  res.json({ token: makeToken(user._id), name: user.name, email: user.email, _id: user._id })
}

module.exports = { signup, login }
