const mongoose = require('mongoose');
const fetch = require('node-fetch');

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
    console.log('Raw event body:', event.body);
    if (!event.body || typeof event.body !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing or invalid' }) };
    }

    const { token, queryType } = JSON.parse(event.body);
    if (!token || !queryType || !['basic', 'advanced'].includes(queryType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid token/queryType' }),
      };
    }

    // Verify access token with Google's userinfo endpoint
    console.log('Verifying access token:', token);
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userInfo = await response.json();
    if (!response.ok) {
      throw new Error(userInfo.error_description || 'Invalid access token');
    }

    const email = userInfo.email;
    if (!email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token: no email found' }),
      };
    }
    console.log('Token verified, email:', email);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI1, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

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
      console.log('Query counts reset for user:', email);
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
    console.log(`Updated ${queryType} query count for user ${email}:`, isBasic ? user.basicQueryCount : user.advancedQueryCount);

    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Query approved' }),
    };
  } catch (error) {
    console.error('Error in check-query-limit:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};