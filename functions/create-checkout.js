// netlify/functions/create-checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { extensionId } = JSON.parse(event.body); // Unique ID from extension
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: 'prod_S31MriBHDXZcyQ', quantity: 1 }],
    mode: 'payment',
    success_url: `https://luisgcastro.com/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: 'https://luisgcastro.com/cancel',
    client_reference_id: extensionId, // Link payment to extension
  });

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
};