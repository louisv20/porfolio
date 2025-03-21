const mongoose = require('mongoose');
const fetch = require('node-fetch'); // Ensure this is in your package.json

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  subscriptionTier: { type: String, default: 'free' },
  basicQueryCount: { type: Number, default: 0 },
  advancedQueryCount: { type: Number, default: 0 },
  billingPeriodStart: { type: Date, default: Date.now },
  stripeCustomerId: { type: String },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

exports.handler = async (event) => {
  try {
    console.log('Raw event body:', event.body);
    if (!event.body || typeof event.body !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing or invalid' }) };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON format in request body' }) };
    }

    const { token } = body;
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing token in request body' }) };
    }

    console.log('Verifying access token:', token);

    // Validate access token with Google's userinfo endpoint
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userInfo = await response.json();
    if (!response.ok) {
      throw new Error(userInfo.error_description || 'Invalid access token');
    }

    const email = userInfo.email;
    if (!email) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token: no email found' }) };
    }

    console.log('Token verified, email:', email);

    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    let user = await User.findOne({ userId: email });
    if (!user) {
      user = new User({ userId: email });
      await user.save();
      console.log('New user created:', email);
    } else {
      console.log('User found:', email);
    }

    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    return {
      statusCode: 200,
      body: JSON.stringify({
        userId: user.userId,
        subscriptionTier: user.subscriptionTier,
        basicQueryCount: user.basicQueryCount,
        advancedQueryCount: user.advancedQueryCount,
      }),
    };
  } catch (error) {
    console.error('Error in verify-google-token:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};