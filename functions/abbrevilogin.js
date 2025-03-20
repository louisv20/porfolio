const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./utils/db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, password } = JSON.parse(event.body);
  const user = await User.findOne({ email });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return {
    statusCode: 200,
    body: JSON.stringify({ token, apiKey: user.apiKey }),
  };
};