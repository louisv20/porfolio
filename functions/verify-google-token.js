const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Define User Schema
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
    const { token } = JSON.parse(event.body);
    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing token' }),
      };
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload['email'];

    if (!email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Check if user exists, create if not
    let user = await User.findOne({ userId: email });
    if (!user) {
      user = new User({ userId: email });
      await user.save();
    }

    // Disconnect (optional, Mongoose manages connections)
    await mongoose.connection.close();

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
    console.error('Error in verify-google-token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};