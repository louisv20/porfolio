const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { deviceHash, isTrial = false } = JSON.parse(event.body);
  
  if (!deviceHash) {
    return { statusCode: 400, body: 'Device hash required' };
  }

  // Generate token with expiration (30 days for trial, 1 year for paid)
  const expirationDays = isTrial ? 30 : 365;
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + expirationDays);
  
  const tokenData = `${deviceHash}${expiration.getTime()}${crypto.randomBytes(16).toString('hex')}`;
  const token = crypto.createHash('sha256').update(tokenData).toString('hex');
  
  // In a real app, you'd store this in a database
  const tokenRecord = {
    token,
    deviceHash,
    isTrial,
    expiresAt: expiration.toISOString(),
    createdAt: new Date().toISOString()
  };

  return {
    statusCode: 200,
    body: JSON.stringify({ token, expiresAt: tokenRecord.expiresAt })
  };
};