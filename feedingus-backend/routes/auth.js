const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const crypto = require('crypto')
const User = require('../models/User')
const sendEmail = require('../utils/sendEmail')
const { protect } = require('../middleware/auth')

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' })

// POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg,
      details: `Received: ${req.body.email || 'no-email'}`,
      errors: errors.array() 
    })
  }

  const { name, email, password, restaurantName, restaurantLocation } = req.body
  try {
    let user = await User.findOne({ email })
    
    if (user && user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already verified',
        details: `This account is already active. Please log in or use 'Forgot Password' if you cannot access it.`
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    if (user && !user.isVerified) {
      // Update existing unverified user
      user.name = name
      user.passwordHash = password // Mongoose middleware will hash this
      user.restaurantName = restaurantName || ''
      user.restaurantLocation = restaurantLocation || ''
      user.otp = otp
      user.otpExpires = otpExpires
      await user.save()
    } else {
      // Create new user
      user = await User.create({
        name, email, passwordHash: password,
        restaurantName: restaurantName || '',
        restaurantLocation: restaurantLocation || '',
        otp,
        otpExpires
      })
    }

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your FeedingUs Verification Code',
        text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
      })
    } catch (err) {
      console.error('Email failed to send', err)
      return res.status(500).json({ 
        success: false, 
        message: 'Could not send verification email',
        details: err.message 
      })
    }

    res.status(user.isNew ? 201 : 200).json({
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

  const { email } = req.body
  const otp = req.body.otp?.toString().trim()
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
      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      user.otp = otp
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
      await user.save()

      try {
        await sendEmail({
          email: user.email,
          subject: 'Verify Your FeedingUs Account',
          text: `Your new verification code is: ${otp}`,
        })
      } catch (err) { console.error('Resend OTP failed', err) }

      return res.status(403).json({ 
        success: false, 
        isVerified: false,
        message: 'Account not verified. A new OTP has been sent to your email.' 
      })
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

// POST /api/auth/resend-otp
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Valid email required'),
], async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Account already verified' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.otp = otp
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendEmail({
      email: user.email,
      subject: 'Your New Verification Code',
      text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    })

    res.json({ success: true, message: 'New OTP sent to email' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  res.json({ success: true, user: req.user })
})

module.exports = router
