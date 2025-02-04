const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const prices = {
    individual: process.env.STRIPE_INDIVIDUAL_PRICE_ID,
    family: process.env.STRIPE_FAMILY_PRICE_ID,  
    galactic: process.env.STRIPE_GALACTIC_PRICE_ID
};

exports.createCustomerAndSubscription = async (email, paymentMethodId, plan) => {
    const customer = await stripe.customers.create({
        email,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId }
    });

    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: prices[plan] }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
    });

    return { customer, subscription };
};