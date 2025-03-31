require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('../mockBcrypt'); // Temporary mock

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_FILE = 'test-user-token.txt';

async function createTestUser() {
  try {
    console.log('🔄 Checking if token file exists...');
    if (fs.existsSync(TOKEN_FILE)) {
      const token = fs.readFileSync(TOKEN_FILE, 'utf8');
      console.log('✅ Token already exists. Reusing stored token.\n');
      console.log('🔑 TOKEN:', token);
      console.log('\n🖥️ CURL EXAMPLE:\n');
      console.log(`curl http://localhost:3000/api/modules/eva/safety -H "Authorization: Bearer ${token}"`);
      return; // Skip database operations since we already have a token
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Define User model if not already defined
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
      console.log('🆕 Creating new test user...');
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: testUser._id,
        email: testUser.email,
        role: testUser.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: '365d' } // 1-year validity
    );

    // Save token to a file
    fs.writeFileSync(TOKEN_FILE, token, 'utf8');
    console.log('✅ Token generated and stored in', TOKEN_FILE);

    console.log('\n🎫 ✅ TEST USER CREDENTIALS');
    console.log('------------------------');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password: Test123456');
    console.log('🆔 User ID:', testUser._id);
    
    console.log('\n🔑 ✅ AUTHENTICATION TOKEN');
    console.log('------------------------');
    console.log(token);
    
    console.log('\n🖥️ ✅ CURL COMMAND EXAMPLE');
    console.log('------------------------');
    console.log(`curl http://localhost:3000/api/modules/eva/safety -H "Authorization: Bearer ${token}"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

// ✅ Run the function
createTestUser();
