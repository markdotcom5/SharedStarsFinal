const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');

const router = express.Router();

router.post('/join-now', async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ success: false, error: 'Email already registered.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    verified: true, // immediate verification for MVP
    createdAt: new Date()
  });

  await newUser.save();

  const token = jwt.sign({ userId: newUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

  res.status(201).json({
    success: true,
    message: 'Signup successful. Welcome aboard!',
    data: {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
      token
    }
  });
});

router.post('/api/verify-account', async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ success: false, error: "Invalid verification code." });
    }

    user.subscription.status = 'active';
    user.verificationCode = undefined;  // Clear the code once verified
    await user.save();

    return res.status(200).json({ success: true, message: "Account verified." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Server error." });
  }
});

module.exports = router;
