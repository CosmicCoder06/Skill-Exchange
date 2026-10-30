const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_MONGO_URI) {
    throw new Error('Database connection blocked: Running in test environment without TEST_MONGO_URI');
  }
  try {
    const uri = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGO_URI : process.env.MONGO_URI;
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
// @teamcosmiccoders
