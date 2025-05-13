// src/services/emailService.js
const axios = require('axios');

const sendReportEmail = async (report) => {
  const apiKey = process.env.SENDER_API_KEY;
  const apiUrl = 'https://api.sender.net/v2/emails';

  const htmlContent = `
    <h1>${report.subject}</h1>
    <p>Overall Score: ${report.scoreData.overallScore}</p>
    ${report.sections
      .map((section) => `<h2>${section.title}</h2><p>${section.content}</p>`)
      .join('')}
    <p>Resources:</p>
    <ul>
      ${report.resourceLinks
        .map((link) => `<li><a href="${link.url}">${link.title}</a></li>`)
        .join('')}
    </ul>
    <p><a href="https://yourdomain.com/unsubscribe?email=${report.recipientEmail}">Unsubscribe</a></p>
    <p>Our Address: 123 Your Street, City, Country</p>
  `;

  const emailData = {
    from: {
      email: 'service@luisgcastro.com', // Replace with your verified Sender email
      name: 'EQ Quiz',
    },
    to: [
      {
        email: report.recipientEmail,
        name: report.recipientEmail.split('@')[0],
      },
    ],
    subject: report.subject,
    html: htmlContent,
    text: 'This is a text version of your Emotional Intelligence Report.',
  };

  try {
    const response = await axios.post(apiUrl, emailData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`Email sent to ${report.recipientEmail}:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendReportEmail };