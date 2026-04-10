require('dotenv').config()
const dns = require('dns')
dns.setDefaultResultOrder('ipv4first')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api', require('./routes/notes'))

app.get('/api/health', (_, res) => res.json({ ok: true }))

async function start() {
  // Hash the plain-text password from .env into ADMIN_PASSWORD_HASH at startup
  process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
