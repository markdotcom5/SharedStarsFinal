const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress.js');

router.get('/user-progress', function(req, res) {
  const userId = req.session.user?.id;  // get user id clearly from session or cookie

  UserProgress.findOne({ userId }).lean()
    .then(function(progress) {
      res.json(progress);
    })
    .catch(function(error) {
      console.error("❌ API Error:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

module.exports = router;
