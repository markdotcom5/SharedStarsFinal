const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');

router.get('/', insightsController.getAllInsights);
router.get('/:id', insightsController.getInsightById);

module.exports = router;