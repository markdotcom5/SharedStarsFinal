// scripts/test-connection.js
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
  }
}

testConnection();
