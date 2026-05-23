const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file!');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    if (err.message.includes('MONGODB_URI')) {
      console.error('👉 Create a .env file in /backend with MONGODB_URI=your_atlas_uri');
    } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('👉 Wrong MongoDB username/password in your URI');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('timed out')) {
      console.error('👉 Check your internet connection or whitelist your IP in Atlas');
    }
    process.exit(1);
  }
};
