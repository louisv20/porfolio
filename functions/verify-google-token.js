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

    // Initialize Google Identity Toolkit client
    const authClient = new IdentityToolkit({
      auth: process.env.GOOGLE_CLIENT_ID,
    });

    // Verify the Google ID token
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

    // Check if user exists, create if not
    let user = await usersCollection.findOne({ userId: email });
    if (!user) {
      user = {
        userId: email,
        subscriptionTier: 'free',
        basicQueryCount: 0,
        advancedQueryCount: 0,
        billingPeriodStart: new Date(),
      };
      await usersCollection.insertOne(user);
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
    console.error('Error in verify-google-token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};