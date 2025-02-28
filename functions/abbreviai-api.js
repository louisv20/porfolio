const expectedSecret = process.env.ABBREVI_SECRET_TOKEN; // Another env variable

export async function handler(event, context) {
  const secret = event.queryStringParameters.secret;
  if (secret !== expectedSecret) {
    return {
      statusCode: 401,
      body: 'Unauthorized'
    };
  }

  const apiKey = process.env.ABBREVI_API_KEY;
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    },
    body: JSON.stringify({ apiKey: apiKey })
  };
}
