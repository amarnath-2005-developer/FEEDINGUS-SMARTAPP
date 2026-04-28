const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Payment = require('../models/Payment')
const Analytics = require('../models/Analytics')
const { protect } = require('../middleware/auth')

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Helper: update analytics when order is placed
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

// Helper: get the io instance (lazy require to avoid circular deps)
function getIo() {
  return require('../server').io
}

// Helper: emit order update to the customer's socket room
function emitOrderUpdate(order) {
  try {
    const io = getIo()
    io.to(`user:${order.userId.toString()}`).emit('order:updated', {
      orderId: order._id,
      status: order.status,
      statusHistory: order.statusHistory,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      deliveredAt: order.deliveredAt,
    })
  } catch (err) {
    console.error('Socket emit error:', err.message)
  }
}

// ─── Valid status transitions ─────────────────────────────────────────────────
const STATUS_TRANSITIONS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['preparing', 'cancelled'],
  preparing:        ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered:        [],
  cancelled:        [],
}

const STATUS_NOTES = {
  confirmed:        'Order confirmed by restaurant',
  preparing:        'Your food is being prepared',
  out_for_delivery: 'Your order is on its way!',
  delivered:        'Order delivered. Enjoy your meal! 🍽️',
  cancelled:        'Order has been cancelled',
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/orders  — create new order
router.post('/', protect, async (req, res) => {
  const { restaurantId, items, totalAmount } = req.body
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' })
  }
  try {
    const now = new Date()
    const estimatedDeliveryTime = new Date(now.getTime() + 30 * 60 * 1000) // +30 minutes

    const order = await Order.create({
      userId: req.user._id,
      restaurantId,
      items,
      totalAmount,
      status: 'confirmed',
      estimatedDeliveryTime,
      statusHistory: [
        { status: 'confirmed', timestamp: now, note: 'Order placed and confirmed' },
      ],
    })

    // Track analytics in background
    trackOrderAnalytics(items).catch(console.error)

    res.status(201).json({ success: true, order })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// GET /api/orders/my  — get current user's orders (outgoing)
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('items.menuItemId', 'name price type')
      .populate('restaurantId', 'restaurantName')
      .sort({ createdAt: -1 })
    res.json({ success: true, count: orders.length, orders })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/orders/incoming  — get orders sent to this restaurant
router.get('/incoming', protect, async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user._id })
      .populate('items.menuItemId', 'name price type')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
    res.json({ success: true, count: orders.length, orders })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/orders/:id  — single order details
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItemId', 'name price type')
      .populate('restaurantId', 'restaurantName')
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    // Only allow owner or restaurant to view
    const isOwner = order.userId.toString() === req.user._id.toString()
    const isRestaurant = order.restaurantId?._id?.toString() === req.user._id.toString()
    if (!isOwner && !isRestaurant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    res.json({ success: true, order })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/orders/clear — clear all orders for the current restaurant
router.delete('/clear', protect, async (req, res) => {
  try {
    await Order.deleteMany({ restaurantId: req.user._id })
    // Delete payments associated with the restaurant as well
    await Payment.deleteMany({ restaurantId: req.user._id })
    res.json({ success: true, message: 'All orders cleared' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/orders/my/clear — clear all orders for the current user
router.delete('/my/clear', protect, async (req, res) => {
  try {
    await Order.deleteMany({ userId: req.user._id })
    await Payment.deleteMany({ userId: req.user._id })
    res.json({ success: true, message: 'All your orders and payments cleared' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PUT /api/orders/:id/status  — update order status (restaurant)
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body
  const allStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']

  if (!allStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${allStatuses.join(', ')}`,
    })
  }

  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })

    // Validate transition
    const currentStatus = order.status === 'pending' ? 'confirmed' : order.status
    const allowed = STATUS_TRANSITIONS[currentStatus] || []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`,
      })
    }

    const now = new Date()
    order.status = status
    order.statusHistory.push({
      status,
      timestamp: now,
      note: STATUS_NOTES[status] || '',
    })

    if (status === 'delivered') {
      order.deliveredAt = now
    }
    if (status === 'out_for_delivery') {
      // Refresh ETA from this moment + 10 min
      order.estimatedDeliveryTime = new Date(now.getTime() + 10 * 60 * 1000)
    }

    await order.save()

    // Sync payment status if needed
    if (status === 'delivered') {
      await Payment.findOneAndUpdate(
        { orderId: order._id, status: 'pending' },
        { status: 'paid', paidAt: now }
      )
    } else if (status === 'cancelled') {
      await Payment.findOneAndUpdate(
        { orderId: order._id, status: 'pending' },
        { status: 'failed' }
      )
    }

    // Emit live update to the customer
    emitOrderUpdate(order)

    res.json({ success: true, order })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
