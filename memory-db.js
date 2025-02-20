// test-mongo-simple.js
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    // Directly use the connection string - no environment variables
    await mongoose.connect('mongodb+srv://MarkAdmin:tfSJzMOBb6TZ22X2@cluster0.20bhg.mongodb.net/StelTrek_MVP5', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ CONNECTION SUCCESSFUL!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test without any other dependencies
testConnection();