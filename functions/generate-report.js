// functions/generate-report.js
const { generateDetailedReport } = require('../src/services/reportService');
const { sendReportEmail } = require('../src/services/emailService');

exports.handler = async (event, context) => {
  // Define allowed origins
  const allowedOrigins = ['http://localhost:5173', 'https://luisgcastro.com']; // Add your production domain here too
  const origin = event.headers.origin;
  let corsHeaders = {};

  if (allowedOrigins.includes(origin)) {
    corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Parse the request body
    const userData = JSON.parse(event.body);

    // Validate input
    if (!userData.score || !userData.categoryScores || !userData.email) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Generate report
    const report = generateDetailedReport(userData);

    // Send email
    await sendReportEmail(report);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Report generated and sent successfully' }),
    };
  } catch (error) {
    console.error('Error processing report:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate or send report' }),
    };
  }
};