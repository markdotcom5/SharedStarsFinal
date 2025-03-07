const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    // Get selected language from session or cookie
    const selectedLang = req.session.language || req.cookies.language || null;
    
    res.render('index', {
        selectedLang: selectedLang,
        // Add any other data you want to pass to the template
    });
});
// Add this to your main server file or routes/index.js
app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working!' });
  });
// Handle language selection
router.post('/set-language', (req, res) => {
    const { language } = req.body;
    
    // Store language preference in session and cookie
    req.session.language = language;
    res.cookie('language', language, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
    
    res.json({ success: true });
});

module.exports = router;