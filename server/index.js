// Global Error Handlers to prevent crash
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Do not exit in Vercel, just log
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const Message = require('./models/Message');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with broad permissions for debugging
// origin: true reflects the request origin, effectively allowing all origins while supporting credentials
const corsOptions = {
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Preflight handled by app.use(cors()) usually, or remove explicit * if causing path-to-regexp error in this environment

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect Database with Middleware for Vercel
app.use(async (req, res, next) => {
  // Skip DB connection for basic routes or static files if needed
  if (req.url === '/' || req.url.startsWith('/uploads') || req.url.startsWith('/api/debug')) {
    return next();
  }
  
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database Connection Failed in Middleware:', error.message);
    res.status(500).json({ 
      message: 'Server Error: Database connection failed', 
      error: error.message 
    });
  }
});

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/materi', require('./routes/materiRoutes'));
app.use('/api/kuis', require('./routes/kuisRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/tts', require('./routes/ttsRoutes'));


// Basic Route
app.get('/', (req, res) => {
  res.send('API EduKasih Running...');
});

// Debug Route
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint',
    origin: req.headers.origin,
    headers: req.headers,
    env: {
      mongo: process.env.MONGO_URI ? 'Set' : 'Unset',
      vercel: process.env.VERCEL
    }
  });
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    let lastPurgeKey = null;
    const checkAndPurge = async () => {
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Jakarta',
          weekday: 'long',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).formatToParts(new Date());
        const get = (type) => parts.find(p => p.type === type)?.value;
        const weekday = get('weekday');
        const hour = get('hour');
        const minute = get('minute');
        const year = get('year');
        const month = get('month');
        const day = get('day');
        const key = `${year}-${month}-${day}`;
        if (weekday === 'Sunday' && hour === '00' && minute === '00' && lastPurgeKey !== key) {
          await Message.deleteMany({});
          lastPurgeKey = key;
          console.log('Forum messages purged for', key);
        }
      } catch (e) {
        console.error('Purge check error', e.message);
      }
    };
    setInterval(checkAndPurge, 30000);
  });
}
