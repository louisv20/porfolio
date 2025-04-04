const crypto = require('crypto');

exports.handler = async (event) => {
  // Get client info from headers
  const userAgent = event.headers['user-agent'];
  const acceptLanguage = event.headers['accept-language'];
  const platform = event.headers['sec-ch-ua-platform'] || 'unknown';
  
  // Create a more robust device fingerprint
  const fingerprintData = `${userAgent}${acceptLanguage}${platform}`;
  const deviceHash = crypto.createHash('sha256').update(fingerprintData).toString('hex');
  
  return {
    statusCode: 200,
    body: JSON.stringify({ deviceHash })
  };
};