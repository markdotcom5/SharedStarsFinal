const express = require('express');
const Stripe = require('stripe');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-subscription', async (req, res) => {
  try {
    const { paymentMethodId, planType } = req.body;

    const planPrices = {
      individual: process.env.STRIPE_INDIVIDUAL_PRICE_ID,
      family: process.env.STRIPE_FAMILY_PRICE_ID,
      elite: process.env.STRIPE_ELITE_PRICE_ID
    };

    const subscription = await stripe.subscriptions.create({
      customer: req.user.stripeCustomerId,
      items: [{ price: planPrices[planType] }],
      payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent']
    });

    res.json({ subscription });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ Correct ES Module export
module.exports = router;
