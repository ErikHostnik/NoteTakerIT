const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Single-user login — credentials come from .env
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }

  const validUser = username === process.env.ADMIN_USERNAME
  const validPass = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)

  if (!validUser || !validPass) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '30d' })
  res.json({ token })
})

module.exports = router
