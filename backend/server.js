// ─── server.js ───────────────────────────────────────────────────────────────
// Entry point. Sets up Express + Socket.io on the same HTTP server.
// Socket.io handles real-time PT chat — messages are broadcast instantly.
// ─────────────────────────────────────────────────────────────────────────────

const http      = require('http')        // Node's built-in HTTP module
const express   = require('express')
const cors      = require('cors')
const dotenv    = require('dotenv')
dotenv.config()
const { Server } = require('socket.io')  // Socket.io server
const connectDB  = require('./config/db')
const passport   = require('./config/passport')
const Message    = require('./models/Message')

connectDB()

const app    = express()
const server = http.createServer(app)    // Wrap Express in HTTP server

// Attach Socket.io to the same HTTP server
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
})

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(passport.initialize())

// ── REST Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'))
app.use('/api/workouts', require('./routes/workouts'))
app.use('/api/chat',     require('./routes/chat'))

// ── Socket.io — Real-time PT Chat ───────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id)

  // Each user joins a room named after their userId so we can target them
  socket.on('join_room', (userId) => {
    socket.join(userId)
    console.log(`User ${userId} joined their room`)
  })

  // When a message is sent, save it to DB then push to recipient in real time
  socket.on('send_message', async (data) => {
    try {
      // Save to MongoDB so message history persists
      const msg = await Message.create({
        fromUser:        data.fromUserId,
        toUser:          data.toUserId,
        text:            data.text,
        workoutSnapshot: data.workoutSnapshot || '',
        workoutTodo:     data.workoutTodo || null,
      })

      // 🚨 THE UPGRADE: Attach the sender's name and email before sending! 🚨
      await msg.populate('fromUser', 'name email')

      // Push to recipient's room (they receive it instantly if online)
      io.to(data.toUserId).emit('receive_message', msg)

      // Confirm back to sender
      socket.emit('message_sent', msg)
    } catch (err) {
      socket.emit('message_error', 'Could not send message')
    }
  })

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`✅ Server + Socket.io running on http://localhost:${PORT}`))