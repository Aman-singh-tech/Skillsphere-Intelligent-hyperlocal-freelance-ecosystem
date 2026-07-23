const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    console.error(
      "   Set MONGO_URI in your .env file to a valid MongoDB Atlas connection string."
    );
    process.exit(1);
  }
};

module.exports = connectDB;
