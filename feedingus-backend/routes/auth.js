const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const crypto = require('crypto')
const User = require('../models/User')
const sendEmail = require('../utils/sendEmail')
const { protect } = require('../middleware/auth')

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })

// POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

  const { name, email, password, restaurantName, restaurantLocation } = req.body
  try {
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' })

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const user = await User.create({
      name, email, passwordHash: password,
      restaurantName: restaurantName || '',
      restaurantLocation: restaurantLocation || '',
      otp,
      otpExpires
    })

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your FeedingUs Verification Code',
        text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
      })
    } catch (err) {
      console.error('Email failed to send', err)
      // We don't fail the registration here, but in production we might want to handle it
    }

    res.status(201).json({
      success: true,
      message: 'OTP sent to email. Please verify to complete registration.',
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/auth/verify-otp
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').notEmpty().withMessage('OTP required'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

  const { email, otp } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ success: false, message: 'User not found' })

    if (user.isVerified) return res.status(400).json({ success: false, message: 'User already verified' })

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
    }

    user.isVerified = true
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, restaurantName: user.restaurantName },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email via OTP first' })
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, restaurantName: user.restaurantName },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  res.json({ success: true, user: req.user })
})

module.exports = router
