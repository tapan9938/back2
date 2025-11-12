import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get all reviews
router.get('/', (req, res) => {
  try {
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY date DESC').all();
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add review
router.post('/', (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    
    if (!name || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating, and comment are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const result = db.prepare(`
      INSERT INTO reviews (name, rating, comment)
      VALUES (?, ?, ?)
    `).run(name, rating, comment);
    
    const newReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({ message: 'Review added successfully', review: newReview });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Get review statistics
router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as average,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews
    `).get();
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

export default router;
