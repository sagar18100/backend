const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const noteRoutes = require('./routes/notes');
const lessonRoutes = require('./routes/lessons');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  'https://www.shivamai.site',
  'https://shivamai.site',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

if (process.env.FRONTEND_ORIGINS) {
  process.env.FRONTEND_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => {
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
      }
    });
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Aman Backend API is running!');
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', noteRoutes);
app.use('/api/lessons', lessonRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// Start server locally (Vercel will ignore this and use the exported app)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));
}

module.exports = app;
