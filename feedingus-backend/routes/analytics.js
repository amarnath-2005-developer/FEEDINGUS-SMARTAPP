const express = require('express')
const router = express.Router()
const Analytics = require('../models/Analytics')
const Order = require('../models/Order')
const { protect } = require('../middleware/auth')

// GET /api/analytics/top-items  — most ordered items for this restaurant
router.get('/top-items', protect, async (req, res) => {
  try {
    const topItems = await Analytics.aggregate([
      { $group: { _id: '$menuItemId', totalOrders: { $sum: '$orderCount' } } },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'menuitems', localField: '_id', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      { $match: { 'item.restaurantId': req.user._id } },
      { $project: { itemName: '$item.name', itemType: '$item.type', totalOrders: 1 } },
    ])
    res.json({ success: true, topItems })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/analytics/user-behavior  — order counts by hour of day for this restaurant
router.get('/user-behavior', protect, async (req, res) => {
  try {
    const records = await Analytics.aggregate([
      { $lookup: { from: 'menuitems', localField: 'menuItemId', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      { $match: { 'item.restaurantId': req.user._id } }
    ])
    // Aggregate peak hours across all items
    const hourTotals = {}
    for (let h = 0; h < 24; h++) hourTotals[String(h)] = 0
    records.forEach(record => {
      if (record.peakHours) {
        record.peakHours.forEach((count, hour) => {
          hourTotals[hour] = (hourTotals[hour] || 0) + count
        })
      }
    })
    const peakHoursArray = Object.entries(hourTotals)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour)

    const totalOrders = await Order.countDocuments({ restaurantId: req.user._id })
    res.json({ success: true, totalOrders, peakHours: peakHoursArray })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
