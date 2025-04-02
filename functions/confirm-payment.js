// .netlify/functions/confirm-payment-success.js
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-here'; // Store in .env

function generateToken(deviceHash) {
  const encoder = new TextEncoder();
  const data = encoder.encode(deviceHash + SECRET_KEY);
  return Buffer.from(data).toString('base64');
}

exports.handler = async (event) => {
  const { device, source } = JSON.parse(event.body);
  if (!device || !source) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing device or source' }) };
  }

  const token = generateToken(device);
  return {
    statusCode: 200,
    body: JSON.stringify({ status: paymentIntent.status, token: generateToken(device) })
  };
};