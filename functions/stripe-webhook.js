// .netlify/functions/stripe-webhook.js
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const session = JSON.parse(event.body); // Stripe webhook payload
  const { deviceHash } = session.metadata; // Assume deviceHash is passed in metadata during checkout

  if (!deviceHash) {
    return { statusCode: 400, body: 'Missing device hash' };
  }

  const tokenPayload = {
    clientRefId: session.client_reference_id, // Unique user/transaction ID from Stripe
    deviceHash,                              // Bind token to this device
    paidAt: Math.floor(Date.now() / 1000),   // Timestamp of payment
  };

  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET1, // Set this in Netlify environment variables
    { expiresIn: '30d' }    // Token expires in 30 days
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};