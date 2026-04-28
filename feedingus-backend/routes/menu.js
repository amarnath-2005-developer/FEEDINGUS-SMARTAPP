const express = require('express')
const router = express.Router()
const MenuItem = require('../models/MenuItem')
const { protect } = require('../middleware/auth')

// GET /api/menu  — public, supports ?type=veg&tag=popular&category=main
router.get('/', async (req, res) => {
  try {
    const filter = { available: true }
    if (req.query.type) filter.type = req.query.type
    if (req.query.tag) filter.tags = req.query.tag
    if (req.query.category) filter.category = req.query.category

    const items = await MenuItem.find(filter).populate('restaurantId', 'restaurantName').sort({ createdAt: -1 })
    res.json({ success: true, count: items.length, items })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' })
    res.json({ success: true, item })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/menu  — restaurant only
router.post('/', protect, async (req, res) => {
  try {
    const item = await MenuItem.create({ ...req.body, restaurantId: req.user._id })
    res.status(201).json({ success: true, item })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// PUT /api/menu/:id  — restaurant only
router.put('/:id', protect, async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!item) return res.status(404).json({ success: false, message: 'Item not found or unauthorized' })
    res.json({ success: true, item })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// DELETE /api/menu/:id  — restaurant only
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId: req.user._id })
    if (!item) return res.status(404).json({ success: false, message: 'Item not found or unauthorized' })
    res.json({ success: true, message: 'Menu item removed' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
