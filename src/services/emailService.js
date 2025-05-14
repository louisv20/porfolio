// src/services/emailService.js
const axios = require('axios');

const sendReportEmail = async (report) => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || 'luisgcastro.com'; // Set your domain in environment variables
  const apiUrl = `https://api.mailgun.net/v3/${domain}/messages`;

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

  const formData = new URLSearchParams();
  formData.append('from', `EQ Quiz <service@${domain}>`);
  formData.append('to', report.recipientEmail);
  formData.append('subject', report.subject);
  formData.append('html', htmlContent);
  formData.append('text', 'This is a text version of your Emotional Intelligence Report.');

  try {
    const response = await axios.post(apiUrl, formData, {
      auth: {
        username: 'api',
        password: apiKey
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log(`Email sent to ${report.recipientEmail}:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendReportEmail };