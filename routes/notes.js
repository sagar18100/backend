const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/notes -> create note
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { module, title, content } = req.body;
        const newNote = new Note({
            user: req.user.id,
            module,
            title: title && title.trim() ? title.trim() : 'Untitled Note',
            content
        });
        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/notes -> get all notes for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        let query = { user: req.user.id };
        if (req.query.module) {
            query.module = req.query.module;
        }
        const notes = await Note.find(query).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/notes/:id -> update note for user
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNote = await Note.findOneAndUpdate(
            { _id: id, user: req.user.id },
            req.body,
            { new: true }
        );
        if (!updatedNote) return res.status(404).json({ message: 'Note not found' });
        res.json(updatedNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/notes/:id -> delete note for user
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNote = await Note.findOneAndDelete({ _id: id, user: req.user.id });
        if (!deletedNote) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
