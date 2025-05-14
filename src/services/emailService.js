// src/services/emailService.js
const axios = require('axios');

const sendReportEmail = async (report) => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || 'luisgcastro.com';
  const apiUrl = `https://api.mailgun.net/v3/${domain}/messages`;

  const htmlContent = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f9fafb; color: #1f2937;">
    <!-- Logo Header -->
    <div style="text-align: center; padding: 1.5rem; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
    </div>
    
    <!-- Main Header -->
    <div style="text-align: center; padding: 2rem 1.5rem; background-color: #06b6d4; color: #ffffff; border-bottom: 4px solid #0891b2;">
      <h1 style="margin: 0; font-size: 1.75rem; font-weight: 600;">${report.subject}</h1>
      <p style="margin-top: 0.5rem; font-size: 1rem; opacity: 0.9;">Prepared exclusively for ${report.recipientEmail}</p>
    </div>

    <!-- Report Content -->
    <div style="padding: 2rem 1.5rem; background-color: #ffffff; border-radius: 0.5rem; margin: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Score Overview -->
      <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb;">
        <h2 style="font-size: 1.25rem; color: #4b5563; margin-bottom: 1rem;">Your Emotional Intelligence Score</h2>
        <div style="font-size: 3rem; font-weight: 700; color: #06b6d4;">${report.scoreData.overallScore}</div>
        <p style="font-size: 1.125rem; color: #6b7280; margin-top: 0.5rem;">${report.scoreType || 'Overall Assessment'}</p>
      </div>
      
      <!-- Category Scores -->
      <div style="margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb;">
        <h2 style="font-size: 1.25rem; color: #4b5563; margin-bottom: 1rem;">Category Breakdown</h2>
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
          ${Object.entries(report.scoreData.categoryBreakdown).map(([category, score]) => `
            <div style="flex-basis: 48%; background-color: #f3f4f6; padding: 1rem; margin-bottom: 1rem; border-radius: 0.375rem; border-left: 4px solid ${score < 50 ? '#ef4444' : score < 75 ? '#f59e0b' : '#10b981'};">
              <div style="font-weight: 600; color: #4b5563;">${category}</div>
              <div style="font-size: 1.25rem; font-weight: 700; margin-top: 0.5rem;">${score}%</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Detailed Sections -->
      ${report.sections.map((section) => `
        <div style="margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb;">
          <h2 style="font-size: 1.25rem; color: #06b6d4; margin-top: 1.5rem; margin-bottom: 1rem; font-weight: 600;">${section.title}</h2>
          <div style="font-size: 0.9375rem; line-height: 1.75; color: #4b5563;">${section.content.replace(/\n\n/g, '<br><br>')}</div>
        </div>
      `).join('')}

      <!-- Resources -->
      <div style="margin-top: 2rem; padding: 1.5rem; background-color: #f3f4f6; border-radius: 0.5rem;">
        <h3 style="font-size: 1.125rem; color: #1f2937; margin-top: 0; margin-bottom: 1rem; font-weight: 600;">Recommended Resources</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${report.resourceLinks.map((link) => `
            <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
              <span style="position: absolute; left: 0; top: 0.25rem; color: #06b6d4;">•</span>
              <a href="${link.url}" style="color: #06b6d4; text-decoration: none; font-size: 0.9375rem; font-weight: 500; transition: color 0.2s ease-in-out;">${link.title}</a>
              ${link.description ? `<div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">${link.description}</div>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 1.5rem; background-color: #f3f4f6; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 0.875rem; margin-bottom: 1rem;">
        <a href="https://luisgcastro.com/unsubscribe?email=${report.recipientEmail}" style="color: #06b6d4; text-decoration: none; margin: 0 0.5rem;">Unsubscribe</a>
      </p>
      <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem;">
        © ${new Date().getFullYear()} Luis G. Castro. All rights reserved.
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