const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const PhysicalTraining = require('../../models/PhysicalTraining');

// ✅ Mission-specific routes
const strengthRoutes = require('./missions/strength');
const enduranceRoutes = require('./missions/endurance');
const balanceRoutes = require('./missions/balance');
const flexibilityRoutes = require('./missions/flexibility');

// ✅ Get all physical training modules
router.get('/', authenticate, async (req, res) => {
  try {
    const physicalModules = await PhysicalTraining.find({});
    if (!physicalModules.length) {
      return res.status(404).json({ success: false, message: "No physical training modules found." });
    }
    res.json({ success: true, modules: physicalModules });
  } catch (error) {
    console.error("❌ Error fetching physical modules:", error);
    res.status(500).json({ success: false, error: "Server error fetching physical modules." });
  }
});

// ✅ Mission-specific endpoints
router.use('/missions/strength', authenticate, strengthRoutes);
router.use('/missions/endurance', authenticate, enduranceRoutes);
router.use('/missions/balance', authenticate, balanceRoutes);
router.use('/missions/flexibility', authenticate, flexibilityRoutes);

// ✅ Recommendations endpoint
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const recommendations = await PhysicalTraining.getRecommendations(req.user.id);
    res.json({ success: true, recommendations });
  } catch (error) {
    console.error("❌ Error fetching recommendations:", error);
    res.status(500).json({ success: false, error: "Server error fetching recommendations." });
  }
});

module.exports = router;
