const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 500 },
}, { timestamps: true })

// One review per user per item
reviewSchema.index({ userId: 1, menuItemId: 1 }, { unique: true })

module.exports = mongoose.model('Review', reviewSchema)
