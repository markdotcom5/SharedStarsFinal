require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Use environment variables instead of hardcoding
const MONGODB_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function createTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Load User model - adjust path if needed
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      username: String,
      password: String,
      role: String,
      profile: {
        firstName: String,
        lastName: String
      }
    }));

    // Check if test user exists
    const testEmail = 'test@example.com';
    let testUser = await User.findOne({ email: testEmail });

    if (!testUser) {
      // Create test user if it doesn't exist
      const hashedPassword = await bcrypt.hash('Test123456', 10);
      
      testUser = new User({
        email: testEmail,
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      });

      await testUser.save();
      console.log('✅ Test user created successfully');
    } else {
      console.log('✅ Test user already exists');
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: testUser._id,
        email: testUser.email,
        role: testUser.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\n✅ TEST USER CREDENTIALS');
    console.log('------------------------');
    console.log('Email:', testEmail);
    console.log('Password: Test123456');
    console.log('User ID:', testUser._id);
    console.log('\n✅ AUTHENTICATION TOKEN');
    console.log('------------------------');
    console.log(token);
    console.log('\n✅ CURL COMMAND EXAMPLE');
    console.log('------------------------');
    console.log(`curl http://localhost:3000/api/modules/eva/safety -H "Authorization: Bearer ${token}"`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

createTestUser();