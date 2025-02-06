// webhooks/stripe.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
 const sig = req.headers['stripe-signature'];
 let event;

 try {
   event = stripe.webhooks.constructEvent(
     req.body,
     sig, 
     process.env.STRIPE_WEBHOOK_SECRET
   );

   switch (event.type) {
     case 'payment_intent.succeeded':
       const paymentIntent = event.data.object;
       await updateSubscriptionPayment(paymentIntent);
       break;

     case 'customer.subscription.updated':
       const subscription = event.data.object;
       await handleSubscriptionUpdate(subscription);
       break;

     case 'customer.subscription.deleted':
       const cancelledSub = event.data.object;
       await handleSubscriptionCancellation(cancelledSub);
       break;
   }

   res.json({received: true});
 } catch (err) {
   res.status(400).send(`Webhook Error: ${err.message}`);
 }
});

async function updateSubscriptionPayment(paymentIntent) {
 const subscription = await Subscription.findOne({ 
   stripeCustomerId: paymentIntent.customer 
 });
 
 subscription.paymentHistory.push({
   amount: paymentIntent.amount / 100,
   transactionId: paymentIntent.id,
   method: 'stripe'
 });

 await subscription.save();
}

async function handleSubscriptionUpdate(stripeSubscription) {
 await Subscription.findOneAndUpdate(
   { stripeCustomerId: stripeSubscription.customer },
   {
     status: stripeSubscription.status,
     renewalInfo: {
       autoRenew: stripeSubscription.cancel_at_period_end === false,
       nextBillingDate: new Date(stripeSubscription.current_period_end * 1000)
     }
   }
 );
}

async function handleSubscriptionCancellation(stripeSubscription) {
 await Subscription.findOneAndUpdate(
   { stripeCustomerId: stripeSubscription.customer },
   { 
     status: 'cancelled',
     endDate: new Date(stripeSubscription.ended_at * 1000)
   }
 );
}

module.exports = router;