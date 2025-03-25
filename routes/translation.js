const express = require('express');
const router = express.Router();
const translationService = require('../services/translationService');

router.get('/:language', async (req, res) => {
    const translations = await translationService.getTranslationsByLanguage(req.params.language);
    res.json(translations);
});

router.post('/', async (req, res) => {
    const { language, key, value } = req.body;
    const translation = await translationService.addTranslation(language, key, value);
    res.json(translation);
});

module.exports = router;
