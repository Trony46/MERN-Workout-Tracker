// ─── routes/chat.js ──────────────────────────────────────────────────────────
const express  = require('express')
const router   = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { findUser, getHistory } = require('../controllers/chatController')

router.use(protect)   // All chat routes need login

router.get('/find-user',          findUser)     // GET /api/chat/find-user?email=...
router.get('/history/:otherUserId', getHistory) // GET /api/chat/history/:id

module.exports = router
