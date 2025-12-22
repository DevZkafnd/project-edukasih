const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    // In Vercel production, do NOT fall back to localhost if variable is missing.
    // This avoids connection refused errors and long timeouts.
    if (process.env.VERCEL && !mongoURI) {
      console.error('FATAL: MONGO_URI environment variable is not defined in Vercel.');
      return; // Return silently (or throw, but let's just log and skip connection to avoid crash loop)
    }

    const uriToUse = mongoURI || 'mongodb://localhost:27017/edukasih';

    const conn = await mongoose.connect(uriToUse, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error Connecting to MongoDB: ${error.message}`);
    // Do not exit process in serverless environment
    // process.exit(1); 
  }
};

module.exports = connectDB;
