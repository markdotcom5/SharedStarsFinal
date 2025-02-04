const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const User = require('../models/User');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Validate Stripe keys
if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe keys are missing in the environment variables');
}

// Centralized error handling
function handleError(res, message, statusCode = 500) {
    console.error(message);
    res.status(statusCode).json({ error: message });
}

// Webhook Route
router.post(
    '/stripe-webhook',
    bodyParser.raw({ type: 'application/json' }),
    async (req, res) => {
        let event;

        try {
            // Verify the Stripe event
            event = stripe.webhooks.constructEvent(
                req.body,
                req.headers['stripe-signature'],
                endpointSecret
            );
        } catch (error) {
            return handleError(res, `Webhook verification failed: ${error.message}`, 400);
        }

        try {
            // Handle different event types
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutComplete(event.data.object);
                    break;
                case 'payment_intent.succeeded':
                    await handlePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await handlePaymentFailure(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
                    break;
            }

            res.json({ received: true });
        } catch (error) {
            handleError(res, `Webhook processing failed: ${error.message}`);
        }
    }
);

// Handle checkout session completion
async function handleCheckoutComplete(session) {
    const userId = session.client_reference_id;
    const amount = session.amount_total / 100;

    try {
        await User.findByIdAndUpdate(
            userId,
            {
                $inc: { tokens: amount },
                $push: {
                    logs: {
                        logId: session.id,
                        action: 'token_purchase',
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );
    } catch (error) {
        console.error('Error handling checkout completion:', error.message);
        throw error;
    }
}

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
    const userId = paymentIntent.metadata.userId;

    try {
        await User.findByIdAndUpdate(userId, {
            $push: {
                logs: {
                    logId: paymentIntent.id,
                    action: 'payment_success',
                    createdAt: new Date()
                }
            }
        });
    } catch (error) {
        console.error('Error handling payment success:', error.message);
        throw error;
    }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
    const userId = paymentIntent.metadata.userId;

    try {
        await User.findByIdAndUpdate(userId, {
            $push: {
                logs: {
                    logId: paymentIntent.id,
                    action: 'payment_failed',
                    createdAt: new Date()
                }
            }
        });
    } catch (error) {
        console.error('Error handling payment failure:', error.message);
        throw error;
    }
}

module.exports = router;
