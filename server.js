const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const noteRoutes = require('./routes/notes');
const lessonRoutes = require('./routes/lessons');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['https://www.shivamai.site', 'https://shivamai.site', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Aman Backend API is running!');
});

app.use('/api/notes', noteRoutes);
app.use('/api/lessons', lessonRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// Start server locally (Vercel will ignore this and use the exported app)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

module.exports = app;
