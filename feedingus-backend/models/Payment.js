const mongoose = require('mongoose')

function generateInvoiceNumber() {
  const date = new Date()
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `INV-${ymd}-${rand}`
}

const itemSnapshotSchema = new mongoose.Schema({
  name: String,
  quantity: { type: Number, min: 1 },
  unitPrice: Number,
  lineTotal: Number,
}, { _id: false })

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurantName: { type: String, default: '' },

  // Item snapshot for invoice rendering (no join needed later)
  items: [itemSnapshotSchema],

  // Billing breakdown
  subtotal:     { type: Number, required: true },
  gstRate:      { type: Number, default: 0.18 },      // 18%
  gstAmount:    { type: Number, required: true },
  deliveryFee:  { type: Number, default: 40 },
  discount:     { type: Number, default: 0 },
  grandTotal:   { type: Number, required: true },

  // Payment
  paymentMode:  { type: String, enum: ['cod', 'card_simulated'], default: 'cod' },
  status:       { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  invoiceNumber: { type: String, default: generateInvoiceNumber },
  paidAt:       { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('Payment', paymentSchema)
