/**
 * API endpoint for handling waitlist signups and creating user records
 * This should be placed in routes/api/waitlist.js
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Import User model - adjust the path as needed
const User = require('../../models/User');

/**
 * POST /api/waitlist/add
 * Add a user to the waitlist and create a minimal user record
 */
router.post('/add', async (req, res) => {
  try {
    const { email, timestamp, source, interests } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // User already exists, update waitlist status
      user.waitlistStatus = {
        joined: timestamp || new Date(),
        source: source || 'website',
        interests: interests || []
      };
      
      await user.save();
      
      return res.json({
        success: true,
        message: 'User updated in waitlist',
        userId: user._id.toString()
      });
    }
    
    // Create a new user with minimal info
    user = new User({
      email,
      username: email.split('@')[0] + '-' + Math.floor(Math.random() * 1000),
      role: 'waitlist',
      status: 'pending',
      waitlistStatus: {
        joined: timestamp || new Date(),
        source: source || 'website',
        interests: interests || []
      },
      preferences: {
        marketing: true
      },
      profile: {
        createdAt: new Date()
      }
    });
    
    await user.save();
    
    // Return success with the user ID
    res.json({
      success: true,
      message: 'User added to waitlist',
      userId: user._id.toString()
    });
  } catch (error) {
    console.error('Error adding user to waitlist:', error);
    
    // Generate a temporary user ID for client-side tracking
    const tempUserId = 'temp-' + uuidv4();
    
    res.status(500).json({
      success: false,
      error: 'Failed to add user to waitlist: ' + error.message,
      userId: tempUserId // Still return a temporary ID for tracking
    });
  }
});

module.exports = router;