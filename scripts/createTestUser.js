// createTestUser.js
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path if necessary

// Function to connect to MongoDB and create a test user
const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas.');

    // Create and save a test user
    const testUser = new User({
      email: 'testuser@example.com',
      password: 'hashedpassword', // Replace with a hashed password if necessary
      roles: ['user'], // Add additional fields as needed
    });

    await testUser.save(); // Save the user to the database
    console.log('✅ Test User Created:', testUser);

  } catch (err) {
    console.error('❌ Error creating test user:', err.message);
  } finally {
    // Close connection after the operation
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
  }
};

// Only run this script when executed directly
if (require.main === module) {
  createTestUser();
}

module.exports = createTestUser;
