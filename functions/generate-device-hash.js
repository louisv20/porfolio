const { MongoClient } = require('mongodb');
const crypto = require('crypto');

exports.handler = async (event) => {
  const uri = process.env.MONGODB_URI1;
  const client = new MongoClient(uri);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // Generate device fingerprint
    const userAgent = event.headers['user-agent'] || '';
    const acceptLanguage = event.headers['accept-language'] || '';
    const platform = event.headers['sec-ch-ua-platform'] || 'unknown';
    const fingerprintData = `${userAgent}${acceptLanguage}${platform}`;
    
    // Fix: Use digest('hex') instead of toString('hex')
    const deviceHash = crypto.createHash('sha256')
      .update(fingerprintData)
      .digest('hex');

    // Database operations
    await client.connect();
    const db = client.db('abbreviaidb');
    const collection = db.collection('devicehashes');

    // Upsert device record
    await collection.updateOne(
      { deviceHash },
      {
        $setOnInsert: {
          deviceHash,
          firstSeen: new Date(),
          userAgent,
          platform
        },
        $set: {
          lastSeen: new Date()
        }
      },
      { upsert: true }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ deviceHash })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.close();
  }
};