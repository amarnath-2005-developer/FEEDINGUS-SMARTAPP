const mongoose = require('mongoose')

const analyticsSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  orderCount: { type: Number, default: 0 },
  peakHours: { type: Map, of: Number, default: {} }, // { "14": 23, "19": 45 }
  date: { type: String, required: true }, // "2025-06-01"
}, { timestamps: true })

analyticsSchema.index({ menuItemId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('Analytics', analyticsSchema)
