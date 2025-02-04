const express = require('express');
const router = express.Router();

// Middleware to check language preferences
const getLanguagePreference = (req, res, next) => {
    req.selectedLang = req.session?.language || req.cookies?.language || 'en';
    next();
};

// Common render function
const renderPage = (page, title) => async (req, res) => {
    try {
        res.render(page, {
            selectedLang: req.selectedLang,
            title: `${title} - StelTrek`,
            isPage: page, // For active nav highlighting
        });
    } catch (error) {
        console.error(`Error rendering ${page}:`, error);
        res.status(500).render('error', {
            error: `Failed to load ${page} page`,
            selectedLang: req.selectedLang
        });
    }
};

// Home page
router.get('/', getLanguagePreference, renderPage('index', 'Your Journey to Space'));

// Language selection endpoint
router.post('/set-language', (req, res) => {
    const { language } = req.body;
    const validLanguages = ['en', 'zh', 'ko', 'es'];
    
    try {
        if (!validLanguages.includes(language)) {
            return res.status(400).json({ 
                error: 'Invalid language selection',
                validOptions: validLanguages
            });
        }

        req.session.language = language;
        res.cookie('language', language, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.json({ success: true, language });
    } catch (error) {
        console.error('Language selection error:', error);
        res.status(500).json({ error: 'Failed to set language preference' });
    }
});

// Main navigation routes
router.get('/why-steltrek', getLanguagePreference, renderPage('why-steltrek', 'Why StelTrek'));
router.get('/about', getLanguagePreference, renderPage('about', 'About'));
router.get('/leaderboard', getLanguagePreference, renderPage('leaderboard', 'Leaderboard'));
router.get('/merchandise', getLanguagePreference, renderPage('merchandise', 'Retail Store'));
router.get('/academy', getLanguagePreference, renderPage('academy', 'StelTrek Academy'));
router.get('/welcome', getLanguagePreference, renderPage('welcome', 'Welcome'));
router.get('/subscribe', getLanguagePreference, renderPage('subscribe', 'Subscription Plans'));

// Training module routes
router.get('/training/:module', getLanguagePreference, (req, res) => {
    const modules = [
        'physical', 'mental', 'psychological', 'spiritual', 
        'technical', 'social', 'simulations', 'creative'
    ];
    
    const module = req.params.module;
    
    if (!modules.includes(module)) {
        return res.status(404).render('error', {
            error: 'Training module not found',
            selectedLang: req.selectedLang
        });
    }
    
    res.render('training/module', {
        selectedLang: req.selectedLang,
        title: `${module.charAt(0).toUpperCase() + module.slice(1)} Training - StelTrek`,
        module: module
    });
});

// Founders and team routes
router.get('/founders', getLanguagePreference, renderPage('founders', 'Our Founders'));
router.get('/team', getLanguagePreference, renderPage('team', 'Our Team'));
router.get('/advisors', getLanguagePreference, renderPage('advisors', 'Board of Advisors'));

// Community routes
router.get('/community', getLanguagePreference, renderPage('community', 'Community Hub'));
router.get('/events', getLanguagePreference, renderPage('events', 'Events'));

// Resource routes
router.get('/resources', getLanguagePreference, renderPage('resources', 'Resources'));
router.get('/careers', getLanguagePreference, renderPage('careers', 'Career Center'));

// Error handling
router.use((err, req, res, next) => {
    console.error('Route error:', err);
    res.status(500).render('error', {
        error: 'An unexpected error occurred',
        selectedLang: req.selectedLang || 'en'
    });
});

module.exports = router;