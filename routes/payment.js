const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const User = require('../models/User');

// Debugging Log: Ensure `authenticate` is a function
console.log('Authenticate Middleware Type:', typeof authenticate); // Should log "function"

// Allowed Subscription Plans
const ALLOWED_PLANS = ['free', 'basic', 'premium', 'enterprise'];

// =======================
// Rate Limiter for Payment Routes
// =======================
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit to 10 requests per IP
    message: { error: 'Too many payment requests. Please try again later.' },
});

// =======================
// Subscribe a User to a Plan
// =======================
router.post('/subscribe', authenticate, async (req, res) => {
    const { plan } = req.body;

    // Validate input
    if (!plan || !ALLOWED_PLANS.includes(plan)) {
        return res.status(400).json({
            error: `Invalid or missing plan. Allowed plans: ${ALLOWED_PLANS.join(', ')}`,
        });
    }

    try {
        // Find user by ID from decoded token
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Update the user's subscription plan
        user.subscription = plan;
        await user.save();

        res.status(200).json({
            message: `Successfully subscribed to the ${plan} plan!`,
            subscription: user.subscription,
        });
    } catch (error) {
        console.error('Error updating subscription:', error.message);
        res.status(500).json({ error: 'Failed to update subscription.' });
    }
});

// =======================
// Process Payment
// =======================
router.post('/process-payment', [authenticate, paymentLimiter], async (req, res) => {
    const { amount, currency } = req.body;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid or missing payment amount.' });
    }
    if (!currency || typeof currency !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing currency.' });
    }

    try {
        // Simulate payment processing (replace with actual payment logic, e.g., Stripe or PayPal)
        console.log(`Processing payment: ${amount} ${currency} for user ${req.user._id}`);
        
        // Placeholder for payment result
        const paymentResult = {
            status: 'success',
            transactionId: 'TXN123456',
            timestamp: new Date(),
        };

        res.status(200).json({
            message: 'Payment processed successfully.',
            paymentDetails: {
                amount,
                currency,
                userId: req.user._id,
                ...paymentResult,
            },
        });
    } catch (error) {
        console.error('Error processing payment:', error.message);
        res.status(500).json({ error: 'Failed to process payment.' });
    }
});

module.exports = router;

