const express = require('express')
const router = express.Router()
const Favorite = require('../models/Favorite')
const { protect } = require('../middleware/auth')

// POST /api/favorites  — save a favorite
router.post('/', protect, async (req, res) => {
  const { menuItemId } = req.body
  if (!menuItemId) return res.status(400).json({ success: false, message: 'menuItemId required' })
  try {
    const fav = await Favorite.create({ userId: req.user._id, menuItemId })
    res.status(201).json({ success: true, favorite: fav })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already in favorites' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/favorites/:userId  — get user's favorites
router.get('/:userId', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    const favorites = await Favorite.find({ userId: req.params.userId })
      .populate('menuItemId', 'name price type tags category')
      .sort({ createdAt: -1 })
    res.json({ success: true, count: favorites.length, favorites })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/favorites/:itemId  — remove from favorites
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const fav = await Favorite.findOneAndDelete({ userId: req.user._id, menuItemId: req.params.itemId })
    if (!fav) return res.status(404).json({ success: false, message: 'Favorite not found' })
    res.json({ success: true, message: 'Removed from favorites' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
