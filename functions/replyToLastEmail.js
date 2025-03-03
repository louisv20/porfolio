const expectedSecret = process.env.composeAndSendEmail; // Another env variable

export async function handler(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow all origins (or specify your extension's origin)
    'Access-Control-Allow-Headers': 'Content-Type', // Allow specific headers
    'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow specific HTTP methods
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No content
      headers,
      body: '',
    };
  }

  // Handle the actual GET request
  if (event.httpMethod === 'GET') {
    const secret = event.queryStringParameters.secret;

    // Validate the secret
    if (secret !== expectedSecret) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Retrieve the API key
    const apiKey = process.env.replyToLastEmail;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ apiKey: apiKey }),
    };
  }

  // Handle unsupported HTTP methods
  return {
    statusCode: 405, // Method Not Allowed
    headers,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
}
