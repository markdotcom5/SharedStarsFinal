// test-mongo-simple.js
const mongoose = require('mongoose');
require("dotenv").config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');

    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not set in .env file.");
    }

    // ✅ Corrected connection function
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ CONNECTION SUCCESSFUL!');

    // ✅ Close the connection after testing
    await mongoose.connection.close();
    console.log('✅ Connection closed.');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1); // Exit process with error code
  }
}

// Run the test
testConnection();
