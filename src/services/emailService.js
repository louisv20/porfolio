// src/services/emailService.js
const axios = require('axios');

const sendReportEmail = async (report) => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || 'luisgcastro.com';
  const apiUrl = `https://api.mailgun.net/v3/${domain}/messages`;

  const htmlContent = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; color: #333;">
      <!-- Header -->
      <div style="text-align: center; padding: 20px; background-color: #007bff; color: #ffffff; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: normal;">${report.subject}</h1>
      </div>

      <!-- Body -->
      <div style="padding: 20px; background-color: #ffffff; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; line-height: 1.5;">Overall Score: <strong>${report.scoreData.overallScore}</strong></p>
        ${report.sections
          .map(
            (section) => `
              <h2 style="font-size: 20px; color: #007bff; margin-top: 20px;">${section.title}</h2>
              <p style="font-size: 14px; line-height: 1.6;">${section.content}</p>
            `
          )
          .join('')}

        <!-- Resources -->
        <h3 style="font-size: 18px; color: #333; margin-top: 20px;">Resources</h3>
        <ul style="list-style: none; padding: 0;">
          ${report.resourceLinks
            .map(
              (link) => `
                <li style="margin-bottom: 10px;">
                  <a href="${link.url}" style="color: #007bff; text-decoration: none; font-size: 14px;">${link.title}</a>
                </li>
              `
            )
            .join('')}
        </ul>

        <!-- Unsubscribe and Footer -->
        <p style="font-size: 14px; margin-top: 20px; text-align: center;">
          <a href="https://yourdomain.com/unsubscribe?email=${report.recipientEmail}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 5px;">Unsubscribe</a>
        </p>
        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
          Our Address: 123 Your Street, City, Country
        </p>
      </div>
    </div>
  `;

  const formData = new URLSearchParams();
  formData.append('from', `EQ Quiz <service@${domain}>`);
  formData.append('to', report.recipientEmail);
  formData.append('subject', report.subject);
  formData.append('html', htmlContent);
  formData.append('text', 'This penas a text version of your Emotional Intelligence Report.');

  try {
    const response = await axios.post(apiUrl, formData, {
      auth: {
        username: 'api',
        password: apiKey,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
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