const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const Module = require('../models/Module');

// Main academy page route
router.get('/', authenticate, async (req, res) => {
    try {
        // Fetch modules
        const modules = await Module.find()
            .select('name description category')
            .sort({ category: 1, name: 1 });

        // Training phases data
        const trainingPhases = [
            {
                title: "Home-Based AI Training",
                description: "Personalized assessments and foundational learning",
                icon: "brain"
            },
            {
                title: "AR/VR Simulations",
                description: "AI-enhanced astronaut training simulations",
                icon: "vr-cardboard"
            },
            {
                title: "Team Training",
                description: "Group exercises and mission planning",
                icon: "users"
            },
            {
                title: "HQ Training",
                description: "Hands-on astronaut readiness training",
                icon: "building"
            },
            {
                title: "Final Certification",
                description: "Mission evaluations and space certification",
                icon: "certificate"
            }
        ];

        // Subscription tiers
        const subscriptionTiers = [
            {
                name: "Explorer",
                price: 49,
                features: [
                    "Basic AI coaching",
                    "Standard training modules",
                    "Daily space briefings",
                    "Community access"
                ],
                timeToSpace: 48
            },
            {
                name: "Pioneer",
                price: 149,
                features: [
                    "Advanced AI coaching",
                    "Priority training slots",
                    "Enhanced space briefings",
                    "VR training sessions",
                    "Weekly expert webinars"
                ],
                timeToSpace: 36
            },
            {
                name: "Elite",
                price: 499,
                features: [
                    "24/7 personalized AI coaching",
                    "All training modules",
                    "Exclusive briefings",
                    "1-on-1 astronaut mentoring",
                    "Priority certification",
                    "HQ training priority"
                ],
                timeToSpace: 24
            }
        ];

        res.render('academy', {
            title: 'SharedStars Academy',
            user: req.user,
            modules,
            trainingPhases,
            subscriptionTiers,
            spotsRemaining: 100 // You can make this dynamic
        });
    } catch (error) {
        console.error('Error loading academy page:', error);
        res.status(500).render('error', { 
            message: 'Error loading academy page',
            error 
        });
    }
});

module.exports = router;