// routes/admin/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/User'); // Adjust path as needed

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

router.post('/logout', (req, res) => {
  // In a stateless JWT auth system, client-side logout is sufficient
  res.json({ success: true });
});

router.get('/check', async (req, res) => {
  try {
    // Get token from authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ authenticated: false });
    }
    
    const token = authHeader.replace('Bearer ', '').trim();
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is admin
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.json({ authenticated: false });
    }
    
    res.json({
      authenticated: true,
      isAdmin: true,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.json({ authenticated: false });
  }
});

module.exports = router;