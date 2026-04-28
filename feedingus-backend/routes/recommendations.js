const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Favorite = require('../models/Favorite')
const MenuItem = require('../models/MenuItem')
const { protect } = require('../middleware/auth')

// GET /api/recommendations/:userId
router.get('/:userId', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    const userId = req.params.userId

    // 1. Get user's past orders — find ordered item IDs
    const orders = await Order.find({ userId }).select('items').limit(20)
    const orderedItemIds = orders.flatMap(o => o.items.map(i => i.menuItemId?.toString())).filter(Boolean)

    // 2. Get user's favorites
    const favorites = await Favorite.find({ userId }).select('menuItemId')
    const favItemIds = favorites.map(f => f.menuItemId.toString())

    // 3. Pull all those items to learn preferred type (veg/non-veg) and categories
    const knownItems = await MenuItem.find({ _id: { $in: [...new Set([...orderedItemIds, ...favItemIds])] } })
    const prefTypes = [...new Set(knownItems.map(i => i.type))]
    const prefCategories = [...new Set(knownItems.map(i => i.category))]

    // 4. Build recommendation query — prefer matching type/category, exclude already ordered
    const filter = {
      available: true,
      _id: { $nin: orderedItemIds }, // don't repeat what they've had
    }
    if (prefTypes.length === 1) filter.type = prefTypes[0] // strong type preference

    let recommended = await MenuItem.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)

    // 5. Fall back to popular items if not enough results
    if (recommended.length < 5) {
      const popular = await MenuItem.find({ available: true, tags: 'popular' }).limit(10)
      const seen = new Set(recommended.map(i => i._id.toString()))
      recommended = [...recommended, ...popular.filter(i => !seen.has(i._id.toString()))].slice(0, 10)
    }

    res.json({ success: true, count: recommended.length, recommendations: recommended })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
