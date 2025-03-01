const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const Module = require('../../models/Module');

router.get('/', async (req, res) => {
    try {
        res.render('training/modules/technical/index', { 
            title: "Technical Training Module",
            modules: await Module.find({ category: 'technical' })
        });
    } catch (error) {
        console.error("❌ Error loading Technical Training Module:", error);
        res.status(500).render('error', { message: "Failed to load technical training module" });
    }
});

module.exports = router;
