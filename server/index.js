const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const Message = require('./models/Message');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigin = process.env.CLIENT_ORIGIN || '*';
const corsOptions = {
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Connect Database
connectDB();

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/materi', require('./routes/materiRoutes'));
app.use('/api/kuis', require('./routes/kuisRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));


// Basic Route
app.get('/', (req, res) => {
  res.send('API EduKasih Running...');
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
