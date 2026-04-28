const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  type: { type: String, enum: ['veg', 'non-veg'], required: true },
  tags: [{ type: String, enum: ['popular', 'recommended', 'new'] }],
  description: { type: String, default: '' },
  available: { type: Boolean, default: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('MenuItem', menuItemSchema)
