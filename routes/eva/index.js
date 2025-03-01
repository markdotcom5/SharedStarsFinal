const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const Module = require('../../models/Module');

router.get('/', async (req, res) => {
    try {
        res.render('training/modules/eva/index', { 
            title: "EVA Training Module",
            modules: await Module.find({ category: 'eva' })
        });
    } catch (error) {
        console.error("❌ Error loading EVA Training Module:", error);
        res.status(500).render('error', { message: "Failed to load EVA training module" });
    }
});

module.exports = router;
