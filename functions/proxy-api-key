// netlify/functions/proxy-api-key.js
import fetch from 'node-fetch';

export async function handler(event, context) {
  // Set CORS headers for client-side access
  const headers = {
    'Access-Control-Allow-Origin': '*', // Adjust as needed
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Handle GET request
  if (event.httpMethod === 'GET') {
    try {
      // Use the same secret from environment variables
      const secret = process.env.composeAndSendEmail;
      const replyToLastEmailUrl = `https://luisgcastro.com/.netlify/functions/replyToLastEmail?secret=${secret}`;

      // Fetch the API key from the existing function
      const response = await fetch(replyToLastEmailUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Return the API key to the client
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ apiKey: data.apiKey }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch API key' }),
      };
    }
  }

  // Handle unsupported methods
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
}
