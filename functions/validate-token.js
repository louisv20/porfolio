const { MongoClient } = require('mongodb');

// MongoDB connection URI - you should use environment variables for this
const uri = process.env.MONGODB_URI1 || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'yourDatabaseName';
const collectionName = 'tokens'; // Collection to store your token records

let client;
let db;

// Initialize MongoDB connection
async function initDB() {
  if (!client) {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { token, deviceHash } = JSON.parse(event.body);
  
  if (!token || !deviceHash) {
    return { statusCode: 400, body: 'Token and device hash required' };
  }

  try {
    // Initialize database connection
    const db = await initDB();
    const collection = db.collection(collectionName);

    // Query the database for the token
    const tokenRecord = await collection.findOne({ token });

    if (!tokenRecord) {
      return { statusCode: 404, body: 'Token not found' };
    }

    if (tokenRecord.deviceHash !== deviceHash) {
      return { statusCode: 403, body: 'Token not valid for this device' };
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return { statusCode: 410, body: 'Token expired' };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        valid: true, 
        isTrial: tokenRecord.isTrial,
        expiresAt: tokenRecord.expiresAt
      })
    };
  } catch (error) {
    console.error('Database error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};