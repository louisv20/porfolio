const User = require('./utils/db');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = event.headers['x-api-key'];
  const { model } = JSON.parse(event.body);
  const user = await User.findOne({ apiKey });

  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid API key' }) };
  }

  if (user.queryUsage[model] >= user.queryLimits[model]) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Query limit reached' }) };
  }

  // Call OpenRouter API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-site.com', // Optional for leaderboard
      'X-Title': 'Your Extension Name', // Optional
    },
    body: JSON.stringify({
      model: model, // e.g., "openai/gpt-3.5-turbo"
      messages: [{ role: 'user', content: 'Hello, how can I assist you?' }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { statusCode: response.status, body: JSON.stringify({ error: data.error }) };
  }

  user.queryUsage[model]++;
  await user.save();

  return {
    statusCode: 200,
    body: JSON.stringify({ result: data.choices[0].message.content }),
  };
};