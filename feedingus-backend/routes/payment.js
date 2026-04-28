const express = require('express')
const router = express.Router()
const Payment = require('../models/Payment')
const Order = require('../models/Order')
const Analytics = require('../models/Analytics')
const { protect } = require('../middleware/auth')

const GST_RATE = 0.18
const DELIVERY_FEE = 40  // ₹ / $ fixed delivery fee

// Helper — track analytics
async function trackOrderAnalytics(items) {
  const today = new Date().toISOString().split('T')[0]
  const hour = String(new Date().getHours())
  for (const item of items) {
    await Analytics.findOneAndUpdate(
      { menuItemId: item.menuItemId, date: today },
      { $inc: { orderCount: item.quantity, [`peakHours.${hour}`]: 1 } },
      { upsert: true, new: true }
    )
  }
}

// Helper — get io safely
function getIo() {
  try { return require('../server').io } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create
// Body: { restaurantId, restaurantName, items, paymentMode, discount? }
// Creates a Payment + Order atomically
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  const { restaurantId, restaurantName, items, paymentMode = 'cod', discount = 0 } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' })
  }

  // ── Server-side billing calculation ──────────────────────────────────────
  const itemSnapshots = items.map(it => ({
    name: it.name,
    quantity: it.quantity,
    unitPrice: it.price,
    lineTotal: +(it.price * it.quantity).toFixed(2),
  }))

  const subtotal    = +itemSnapshots.reduce((s, it) => s + it.lineTotal, 0).toFixed(2)
  const gstAmount   = +(subtotal * GST_RATE).toFixed(2)
  const discountAmt = +Math.min(discount, subtotal).toFixed(2)
  const grandTotal  = +(subtotal + gstAmount + DELIVERY_FEE - discountAmt).toFixed(2)

  try {
    // 1. Create the FeedingUs Order
    const now = new Date()
    const orderItems = items.map(it => ({
      menuItemId: it.menuItemId,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    }))

    const order = await Order.create({
      userId: req.user._id,
      restaurantId,
      items: orderItems,
      totalAmount: grandTotal,
      status: 'confirmed',
      estimatedDeliveryTime: new Date(now.getTime() + 30 * 60 * 1000),
      statusHistory: [{ status: 'confirmed', timestamp: now, note: 'Order placed' }],
    })

    // 2. Create the Payment record
    const payment = await Payment.create({
      userId: req.user._id,
      orderId: order._id,
      restaurantId,
      restaurantName: restaurantName || '',
      items: itemSnapshots,
      subtotal,
      gstRate: GST_RATE,
      gstAmount,
      deliveryFee: DELIVERY_FEE,
      discount: discountAmt,
      grandTotal,
      paymentMode,
      // COD stays pending until delivery; simulated card marks paid instantly
      status: paymentMode === 'card_simulated' ? 'paid' : 'pending',
      paidAt: paymentMode === 'card_simulated' ? now : undefined,
    })

    // 3. Analytics (background)
    trackOrderAnalytics(orderItems).catch(console.error)

    // 4. Socket — notify user of new order
    try {
      const io = getIo()
      if (io) {
        io.to(`user:${req.user._id.toString()}`).emit('order:updated', {
          orderId: order._id,
          status: order.status,
          statusHistory: order.statusHistory,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
        })
      }
    } catch {}

    res.status(201).json({ success: true, payment, order })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/:id/confirm
// Marks a COD payment as paid (called when restaurant marks delivered)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' })
    if (payment.status === 'paid') return res.json({ success: true, payment })

    payment.status = 'paid'
    payment.paidAt = new Date()
    await payment.save()

    res.json({ success: true, payment })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/history
// Current user's payment history, newest first
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('orderId', 'status statusHistory estimatedDeliveryTime')
      .sort({ createdAt: -1 })
    res.json({ success: true, count: payments.length, payments })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/:id/invoice
// Returns invoice data for a single payment
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/invoice', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('orderId', 'status createdAt')

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' })
    if (payment.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    res.json({ success: true, invoice: payment })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
