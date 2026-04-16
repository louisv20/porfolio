// .netlify/functions/validate-license.js
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const { token, currentDeviceHash } = JSON.parse(event.body);

  if (!token || !currentDeviceHash) {
    return { statusCode: 400, body: 'Missing token or device hash' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.deviceHash !== currentDeviceHash) {
      return { statusCode: 401, body: 'Device mismatch' };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true, clientRefId: decoded.clientRefId }),
    };
  } catch (err) {
    return { statusCode: 401, body: 'Invalid or expired token' };
  }
};