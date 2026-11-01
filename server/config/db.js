const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // quiet
}

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

