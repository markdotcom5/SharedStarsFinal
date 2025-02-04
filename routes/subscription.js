const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const subscriptionController = require('../controllers/subscriptionController');
const { validateCreateSubscription, validateUpdatePaymentStatus } = require('../validators/subscriptionValidator'); // Import validators

// ========================
// Subscription Routes
// ========================

// Create a New Subscription
router.post('/create', authenticate, validateCreateSubscription, async (req, res, next) => {
    try {
        await subscriptionController.createSubscription(req, res, next);
    } catch (error) {
        console.error('Error in /create:', error.message);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

// Update Payment Status for a Subscription
router.post('/update-payment-status', authenticate, validateUpdatePaymentStatus, async (req, res, next) => {
    try {
        await subscriptionController.updatePaymentStatus(req, res, next);
    } catch (error) {
        console.error('Error in /update-payment-status:', error.message);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});

// Get Subscription Status by User
router.get('/status', authenticate, async (req, res, next) => {
    try {
        await subscriptionController.getSubscriptionStatus(req, res, next);
    } catch (error) {
        console.error('Error in /status:', error.message);
        res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
});
// routes/subscription.js
router.post('/update-tier', authenticate, async (req, res) => {
    try {
        const { tier } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, {
            'subscription.tier': tier,
            'subscription.updatedAt': new Date(),
            spaceReadinessScore: tier === 'elite' ? 1000 : 500
        }, { new: true });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Additional Routes (Optional)
router.post('/cancel', authenticate, async (req, res, next) => {
    try {
        await subscriptionController.cancelSubscription(req, res, next);
    } catch (error) {
        console.error('Error in /cancel:', error.message);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

router.post('/renew', authenticate, async (req, res, next) => {
    try {
        await subscriptionController.renewSubscription(req, res, next);
    } catch (error) {
        console.error('Error in /renew:', error.message);
        res.status(500).json({ error: 'Failed to renew subscription' });
    }
});

module.exports = router;
