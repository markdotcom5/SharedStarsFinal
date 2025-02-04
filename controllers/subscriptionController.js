const Subscription = require('../models/Subscription');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class SubscriptionController {
    constructor() {
        this.planPricing = {
            individual: { price: 49.99, vrHours: 10, credits: 100, members: 1 },
            family: { price: 89.99, vrHours: 50, credits: 250, members: 4 },
            galactic: { price: 2048, vrHours: 0, credits: 1000, members: 1 }
        };
    }

    async createSubscription(req, res) {
        const { userId, plan, paymentMethodId } = req.body;

        try {
            const existingSub = await Subscription.findOne({ 
                userId, 
                status: { $in: ['active', 'pending'] } 
            });
            
            if (existingSub) {
                return res.status(400).json({ error: 'Active subscription exists' });
            }

            const planDetails = this.planPricing[plan];
            if (!planDetails) {
                return res.status(400).json({ error: 'Invalid plan' });
            }

            const customer = await this.createOrGetStripeCustomer(userId);
            const subscription = await this.createStripeSubscription(
                customer.id,
                paymentMethodId,
                planDetails.price
            );

            const newSubscription = new Subscription({
                userId,
                plan,
                stripeSubscriptionId: subscription.id,
                price: planDetails.price,
                features: this.getFeatures(plan),
                renewalInfo: {
                    nextBillingDate: new Date(subscription.current_period_end * 1000)
                }
            });

            await newSubscription.save();
            await User.findByIdAndUpdate(userId, { 
                subscriptionId: newSubscription._id,
                credits: planDetails.credits
            });

            res.status(201).json(newSubscription);
        } catch (error) {
            logger.error('Subscription creation failed:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            switch (event.type) {
                case 'invoice.payment_succeeded':
                    await this.handleSuccessfulPayment(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.handleFailedPayment(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCancelled(event.data.object);
                    break;
            }

            res.json({ received: true });
        } catch (error) {
            logger.error('Webhook handling failed:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async upgradeSubscription(req, res) {
        const { subscriptionId, newPlan } = req.body;

        try {
            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription) {
                return res.status(404).json({ error: 'Subscription not found' });
            }

            const planDetails = this.planPricing[newPlan];
            if (!planDetails) {
                return res.status(400).json({ error: 'Invalid plan' });
            }

            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                items: [{ price: planDetails.price }],
                proration_behavior: 'always_invoice'
            });

            subscription.plan = newPlan;
            subscription.price = planDetails.price;
            subscription.features = this.getFeatures(newPlan);
            await subscription.save();

            await User.findByIdAndUpdate(subscription.userId, {
                credits: planDetails.credits
            });

            res.json(subscription);
        } catch (error) {
            logger.error('Upgrade failed:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async pauseSubscription(req, res) {
        const { subscriptionId } = req.body;

        try {
            const subscription = await Subscription.findById(subscriptionId);
            if (!subscription?.stripeSubscriptionId) {
                return res.status(404).json({ error: 'Subscription not found' });
            }

            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                pause_collection: { behavior: 'void' }
            });

            subscription.status = 'paused';
            await subscription.save();

            res.json(subscription);
        } catch (error) {
            logger.error('Pause failed:', error);
            res.status(500).json({ error: error.message });
        }
    }

    getFeatures(plan) {
        const planDetails = this.planPricing[plan];
        return {
            maxVRHours: planDetails.vrHours,
            aiCoach: true,
            spaceCredits: planDetails.credits,
            memberAccess: planDetails.members,
            privateFacility: plan === 'galactic',
            priorityAccess: plan === 'galactic'
        };
    }

    async createOrGetStripeCustomer(userId) {
        const user = await User.findById(userId);
        if (user.stripeCustomerId) {
            return await stripe.customers.retrieve(user.stripeCustomerId);
        }

        const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId: user._id.toString() }
        });

        await User.findByIdAndUpdate(userId, { stripeCustomerId: customer.id });
        return customer;
    }

    async createStripeSubscription(customerId, paymentMethodId, price) {
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId
        });

        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        return await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price }],
            expand: ['latest_invoice.payment_intent']
        });
    }
}
// Replace the exports.createSubscription with:
exports.createSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.create(req.body);
        res.status(201).json(subscription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = new SubscriptionController();