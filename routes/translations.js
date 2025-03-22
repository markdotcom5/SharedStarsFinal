// routes/translations.js
const express = require('express');
const router = express.Router();
const Translation = require('../models/Translation');

// Get translations for a specific language
router.get('/:lang', async (req, res) => {
  try {
    const lang = req.params.lang;
    const translation = await Translation.findOne({ language: lang });
    
    if (!translation) {
      return res.status(404).json({ error: 'Language not found' });
    }
    
    // Convert Map to object for response
    const data = {};
    translation.data.forEach((value, key) => {
      data[key] = value;
    });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// For admin: Add or update translations
router.post('/:lang', async (req, res) => {
  try {
    const lang = req.params.lang;
    const newData = req.body;
    
    // Find and update or create new
    const result = await Translation.findOneAndUpdate(
      { language: lang },
      { 
        $set: { 
          lastUpdated: new Date() 
        },
        $setOnInsert: { 
          language: lang
        }
      },
      { upsert: true, new: true }
    );
    
    // Update individual translations
    for (const [key, value] of Object.entries(newData)) {
      result.data.set(key, value);
    }
    
    await result.save();
    
    res.json({ success: true, message: 'Translations updated' });
  } catch (error) {
    console.error('Error updating translations:', error);
    res.status(500).json({ error: 'Failed to update translations' });
  }
});

module.exports = router;