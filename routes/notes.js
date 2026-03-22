const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// POST /api/notes -> create note
router.post('/', async (req, res) => {
    try {
        const { module, title, content } = req.body;
        const newNote = new Note({
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

// GET /api/notes -> get all notes / filter by module
router.get('/', async (req, res) => {
    try {
        let query = {};
        if (req.query.module) {
            query.module = req.query.module;
        }
        const notes = await Note.find(query);
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/notes/:id -> update note
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNote = await Note.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedNote) return res.status(404).json({ message: 'Note not found' });
        res.json(updatedNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/notes/:id -> delete note
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNote = await Note.findByIdAndDelete(id);
        if (!deletedNote) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
