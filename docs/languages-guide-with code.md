Code Samples for Implementation
1. HTML Header with Language Dropdown (for homepage only)
htmlCopy<!-- Language Selector Dropdown -->
<div class="relative inline-block text-left mr-2">
  <button id="language-dropdown-btn" class="flex items-center text-gray-300 hover:text-white" aria-haspopup="true" aria-expanded="false">
    <span id="current-language">🇺🇸 EN</span>
    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
  </button>
  <div id="language-dropdown" class="hidden absolute right-0 mt-2 w-40 bg-gray-800 rounded-md shadow-lg z-50">
    <div class="py-1">
      <button class="lang-btn w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center" data-lang="en">
        <span class="mr-2">🇺🇸</span> English
      </button>
      <button class="lang-btn w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center" data-lang="es">
        <span class="mr-2">🇪🇸</span> Español
      </button>
      <button class="lang-btn w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center" data-lang="ko">
        <span class="mr-2">🇰🇷</span> 한국어
      </button>
      <button class="lang-btn w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center" data-lang="zh">
        <span class="mr-2">🇨🇳</span> 中文
      </button>
    </div>
  </div>
</div>
2. Script Includes for Homepage
htmlCopy<!-- Add these before the closing </body> tag -->
<script src="/js/languageManager.js" defer></script>
<script src="/js/languageDropdown.js" defer></script>
3. Script Include for Other Pages
htmlCopy<!-- Add this before the closing </body> tag on all pages except homepage -->
<script src="/js/languageManager.js" defer></script>
4. MongoDB Model for Translations
javascriptCopy// models/Translation.js
const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    unique: true,
    enum: ['en', 'es', 'ko', 'zh']
  },
  data: {
    type: Map,
    of: String,
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Translation', translationSchema);
5. Express Route for Translations API
javascriptCopy// routes/translations.js
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
        $set: { lastUpdated: new Date() },
        $setOnInsert: { language: lang }
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
6. MongoDB Seed Data Example
javascriptCopy// Example command to run in MongoDB shell
db.translations.insertOne({
  language: "en",
  data: {
    "hero.title": "The Future Belongs to Those Who Prepare Today",
    "hero.subtitle": "Train for space with AI-powered modules at SharedStars Academy"
    // Add other English translations
  }
})

db.translations.insertOne({
  language: "es",
  data: {
    "hero.title": "El futuro pertenece a quienes se preparan hoy",
    "hero.subtitle": "Entrena para el espacio con módulos impulsados por IA en SharedStars Academy"
    // Add other Spanish translations
  }
})
7. Add API Integration to app.js
javascriptCopy// In your app.js file
const translationsRoutes = require('./routes/translations');
app.use('/api/translations', translationsRoutes);
8. Testing the Translation Implementation
javascriptCopy// Add this to a test page to verify translations are working
document.addEventListener('DOMContentLoaded', function() {
  console.log('Current language:', window.languageManager.currentLang);
  
  // Test getting a translation programmatically
  console.log('Hero title translation:', window.languageManager.getTranslation('hero.title'));
  
  // Test switching language programmatically
  document.querySelectorAll('.test-lang-switch').forEach(btn => {
    btn.addEventListener('click', function() {
      const lang = this.getAttribute('data-lang');
      window.languageManager.setLanguage(lang);
      console.log('Switched to:', lang);
    });
  });
});