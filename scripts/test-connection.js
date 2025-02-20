// scripts/test-connection.js
const mongoose = require('mongoose');

// Hard-code the connection string
const MONGODB_URI = 'mongodb+srv://MarkAdmin:0Bg7fwUuTNgQ2o3L@cluster0.20bhg.mongodb.net/StelTrek_MVP5';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB with URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connection successful!');
    
    // List all collections to verify connection works
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

testConnection();