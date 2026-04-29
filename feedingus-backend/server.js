const http = require('http')
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const connectDB = require('./config/db')

// Load env
dotenv.config()

// Connect to MongoDB Atlas
connectDB()

const app = express()
const server = http.createServer(app)

// ─── Socket.io setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://localhost:5175',
      'https://feedingus-smartapp.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// JWT auth middleware for sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Authentication error: no token'))
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.userId = decoded.id
    next()
  } catch {
    next(new Error('Authentication error: invalid token'))
  }
})

io.on('connection', (socket) => {
  // Each user joins their own private room
  socket.join(`user:${socket.userId}`)
  console.log(`⚡ Socket connected — user:${socket.userId}`)

  socket.on('disconnect', () => {
    console.log(`⚡ Socket disconnected — user:${socket.userId}`)
  })
})

// Export io so routes can emit events
module.exports.io = io

// ─── Express middleware ───────────────────────────────────────────────────────
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175',
    'https://feedingus-smartapp.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean), 
  credentials: true 
}))
app.use(express.json())

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'))
app.use('/api/menu', require('./routes/menu'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/favorites', require('./routes/favorites'))
app.use('/api/recommendations', require('./routes/recommendations'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/reviews', require('./routes/reviews'))
app.use('/api/payment', require('./routes/payment'))

// Root route
app.get('/', (req, res) => {
  res.json({ success: true, message: '🥘 FeedingUs Backend API is Live!', documentation: 'See README.md' })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🚀 FeedingUs API is running', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 FeedingUs API + WebSocket running on http://localhost:${PORT}`)
})
