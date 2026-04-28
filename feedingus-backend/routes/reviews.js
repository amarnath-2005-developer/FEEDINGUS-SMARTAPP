const express = require('express')
const router = express.Router()
const Review = require('../models/Review')
const { protect } = require('../middleware/auth')

// POST /api/reviews  — submit a review
router.post('/', protect, async (req, res) => {
  const { menuItemId, rating, comment } = req.body
  if (!menuItemId || !rating) {
    return res.status(400).json({ success: false, message: 'menuItemId and rating are required' })
  }
  try {
    const review = await Review.create({ userId: req.user._id, menuItemId, rating, comment })
    res.status(201).json({ success: true, review })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already reviewed this item' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/reviews/:menuItemId  — get reviews for an item (public)
router.get('/:menuItemId', async (req, res) => {
  try {
    const reviews = await Review.find({ menuItemId: req.params.menuItemId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })

    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

    res.json({ success: true, count: reviews.length, avgRating, reviews })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/reviews/:id  — delete own review
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' })
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    await review.deleteOne()
    res.json({ success: true, message: 'Review deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
