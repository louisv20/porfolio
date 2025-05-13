// functions/generate-report.js
const { generateDetailedReport } = require('../src/services/reportService');
const { sendReportEmail } = require('../src/services/emailService');

exports.handler = async (event, context) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Parse the request body
    const userData = JSON.parse(event.body);

    // Validate input
    if (!userData.score || !userData.categoryScores || !userData.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Generate report
    const report = generateDetailedReport(userData);

    // Send email
    await sendReportEmail(report);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Report generated and sent successfully' }),
    };
  } catch (error) {
    console.error('Error processing report:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate or send report' }),
    };
  }
};