const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');

// Middleware for Admin authentication
const authAdmin = (req, res, next) => {
  const password = process.env.ADMIN_PASS || 'csacademyadmin123'; // Fallback password
  if (req.headers.authorization !== password) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin Password' });
  }
  next();
};

// Get all lessons (for listing)
router.get('/', async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: -1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching lessons' });
  }
});

// Get a specific lesson by lessonId
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ lessonId: req.params.id });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching lesson' });
  }
});

// Create a new lesson (Admin functionality)
router.post('/', authAdmin, async (req, res) => {
  try {
    const { lessonId, title, subtitle, tag, xp, html, toc } = req.body;
    const newLesson = new Lesson({ lessonId, title, subtitle, tag, xp, html, toc });
    await newLesson.save();
    res.status(201).json(newLesson);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Lesson ID already exists' });
    res.status(500).json({ error: 'Server error creating lesson', details: err.message });
  }
});

// Update a lesson
router.put('/:id', authAdmin, async (req, res) => {
    try {
      const updatedLesson = await Lesson.findOneAndUpdate(
          { lessonId: req.params.id },
          req.body,
          { new: true }
      );
      if (!updatedLesson) return res.status(404).json({ error: 'Lesson not found' });
      res.json(updatedLesson);
    } catch (err) {
      res.status(500).json({ error: 'Server error updating lesson', details: err.message });
    }
  });

// Delete a lesson
router.delete('/:id', authAdmin, async (req, res) => {
    try {
      const deletedLesson = await Lesson.findOneAndDelete({ lessonId: req.params.id });
      if (!deletedLesson) return res.status(404).json({ error: 'Lesson not found' });
      res.json({ message: 'Lesson deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Server error deleting lesson' });
    }
  });

module.exports = router;
