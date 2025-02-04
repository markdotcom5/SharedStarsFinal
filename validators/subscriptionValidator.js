const Joi = require('joi');

// Validate Create Subscription
exports.validateCreateSubscription = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.string().required(),
        plan: Joi.string().valid('individual', 'family', 'galactic').required(),
        credits: Joi.number().min(0).optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

// Validate Update Payment Status
exports.validateUpdatePaymentStatus = (req, res, next) => {
    const schema = Joi.object({
        subscriptionId: Joi.string().required(),
        paymentStatus: Joi.string().valid('success', 'failed').required(),
        transactionId: Joi.string().optional(),
        amount: Joi.number().min(0).optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
