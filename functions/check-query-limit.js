const { MongoClient } = require('mongodb');
const { IdentityToolkit } = require('@google-cloud/identity-toolkit');

exports.handler = async (event) => {
  try {
    // Parse the request body
    const { token, queryType } = JSON.parse(event.body);
    if (!token || !queryType || !['basic', 'advanced'].includes(queryType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid token/queryType' }),
      };
    }

    // Verify Google token
    const authClient = new IdentityToolkit({
      auth: process.env.GOOGLE_CLIENT_ID,
    });
    const { email } = await authClient.verifyIdToken({ idToken: token });
    if (!email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('abbreviaidb');
    const usersCollection = db.collection('users');

    // Find user
    let user = await usersCollection.findOne({ userId: email });
    if (!user) {
      await client.close();
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
      await usersCollection.updateOne(
        { userId: email },
        { $set: { basicQueryCount: 0, advancedQueryCount: 0, billingPeriodStart: new Date() } }
      );
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
      await client.close();
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Query limit reached. Please upgrade.' }),
      };
    }

    // Increment the appropriate count
    const updateField = isBasic ? 'basicQueryCount' : 'advancedQueryCount';
    await usersCollection.updateOne(
      { userId: email },
      { $inc: { [updateField]: 1 } }
    );

    await client.close();

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