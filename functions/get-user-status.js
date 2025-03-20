const { MongoClient } = require('mongodb');
const { IdentityToolkit } = require('@google-cloud/identity-toolkit');

exports.handler = async (event) => {
  try {
    // Parse the request body
    const { token } = JSON.parse(event.body);
    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing token' }),
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

    await client.close();

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
    console.error('Error in get-user-status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};