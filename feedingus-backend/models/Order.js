const mongoose = require('mongoose')

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { _id: false })

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: String,
  quantity: { type: Number, min: 1 },
  price: Number,
}, { _id: false })

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'confirmed',
  },
  statusHistory: [statusHistorySchema],
  estimatedDeliveryTime: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
