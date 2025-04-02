// .netlify/functions/confirm-payment.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function generateToken(deviceHash) {
  const SECRET_KEY = process.env.SECRET_KEY;
  if (!SECRET_KEY) {
    console.error('SECRET_KEY is not set in environment variables');
    throw new Error('Server configuration error: SECRET_KEY missing');
  }
  if (!deviceHash) {
    console.error('No deviceHash provided to generateToken');
    throw new Error('Device hash is required');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(deviceHash + SECRET_KEY);
  return Buffer.from(data).toString('base64');
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { paymentIntentId, device, source } = body;
    console.log('Received request:', { paymentIntentId, device, source });

    if (!paymentIntentId) {
      console.error('Missing paymentIntentId in request body');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing paymentIntentId' })
      };
    }

    if (!device) {
      console.error('Missing device in request body');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing device hash' })
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error: Stripe key missing' })
      };
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      console.error('Failed to retrieve PaymentIntent: null response');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to retrieve payment details' })
      };
    }
    console.log('PaymentIntent retrieved:', paymentIntent);

    const token = generateToken(device);
    console.log('Generated token:', token);

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: paymentIntent.status,
        token: token
      })
    };
  } catch (error) {
    console.error('Error in confirm-payment:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Server error: ${error.message}` })
    };
  }
};