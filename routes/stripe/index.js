const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

module.exports = router;