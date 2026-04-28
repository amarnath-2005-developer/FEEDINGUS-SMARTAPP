const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  restaurantName: { type: String, default: '' },
  restaurantLocation: { type: String, default: '' },
  restaurantValidation: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: '' },
  otpExpires: { type: Date }
}, { timestamps: true })

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

// Compare entered password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash)
}

module.exports = mongoose.model('User', userSchema)
