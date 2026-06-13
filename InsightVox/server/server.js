require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const messageRoutes = require('./routes/messages');

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images/videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the frontend (client) folder so the whole site can run from one server
app.use(express.static(path.join(__dirname, '..', 'client')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); // exposes /api/posts/:postId/comments and /api/comments/:id
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Fallback: 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Generic error handler (e.g. multer file errors)
app.use((err, req, res, next) => {
  console.error(err);
  const isMulterError = err && err.name === 'MulterError';
  const status = err.status || (isMulterError ? 400 : 500);
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`InsightVox server running on port ${PORT}`));
