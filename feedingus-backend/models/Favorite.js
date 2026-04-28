const mongoose = require('mongoose')

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
}, { timestamps: true })

// Prevent duplicate favorites
favoriteSchema.index({ userId: 1, menuItemId: 1 }, { unique: true })

module.exports = mongoose.model('Favorite', favoriteSchema)
