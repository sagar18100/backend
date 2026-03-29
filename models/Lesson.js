const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  lessonId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    default: 'beginner'
  },
  xp: {
    type: Number,
    default: 50
  },
  html: {
    type: String,
    required: true
  },
  toc: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
