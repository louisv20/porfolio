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
    const { token, queryType } = JSON.parse(event.body);
    if (!token || !queryType || !['basic', 'advanced'].includes(queryType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid token/queryType' }),
      };
    }

    // Verify Google token
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

    // Find user
    let user = await User.findOne({ userId: email });
    if (!user) {
      await mongoose.connection.close();
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Reset counts if billing period has passed
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
    if (new Date(user.billingPeriodStart) < oneMonthAgo) {
      user.basicQueryCount = 0;
      user.advancedQueryCount = 0;
      user.billingPeriodStart = new Date();
      await user.save();
    }

    // Define limits based on tier
    const limits = {
      free: { basic: 10, advanced: 0 },
      basic: { basic: 2000, advanced: 100 },
      pro: { basic: 5000, advanced: 200 },
      unlimited: { basic: Infinity, advanced: 300 },
    };
    const userLimits = limits[user.subscriptionTier] || limits.free;

    // Check and update query count
    const isBasic = queryType === 'basic';
    const currentCount = isBasic ? user.basicQueryCount : user.advancedQueryCount;
    const maxCount = isBasic ? userLimits.basic : userLimits.advanced;

    if (currentCount >= maxCount) {
      await mongoose.connection.close();
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Query limit reached. Please upgrade.' }),
      };
    }

    // Increment the appropriate count
    if (isBasic) {
      user.basicQueryCount += 1;
    } else {
      user.advancedQueryCount += 1;
    }
    await user.save();

    await mongoose.connection.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Query approved' }),
    };
  } catch (error) {
    console.error('Error in check-query-limit:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};