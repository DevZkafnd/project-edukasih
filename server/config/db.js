const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    // console.log('MongoDB already connected');
    return mongoose.connection;
  }

  if (cachedPromise) {
    // console.log('MongoDB connection promise reused');
    return cachedPromise;
  }

  const mongoURI = process.env.MONGO_URI;

  if (process.env.VERCEL && !mongoURI) {
    const err = new Error('FATAL: MONGO_URI environment variable is not defined in Vercel.');
    console.error(err.message);
    throw err;
  }

  const uriToUse = mongoURI || 'mongodb://localhost:27017/edukasih';

  try {
    cachedPromise = mongoose.connect(uriToUse, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false // Disable buffering to fail fast if no connection
    });

    const conn = await cachedPromise;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error Connecting to MongoDB: ${error.message}`);
    cachedPromise = null; // Reset promise on error so we can retry
    throw error;
  }
};

module.exports = connectDB;
