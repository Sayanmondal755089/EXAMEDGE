const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/examedge';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ MongoDB connected:', uri.includes('@') ? uri.split('@')[1] : uri);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('   Make sure MongoDB is running or MONGODB_URI is correct in .env');
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
  isConnected = false;
  setTimeout(connectDB, 5000);
});

module.exports = connectDB;
