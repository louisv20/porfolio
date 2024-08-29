exports.handler = async function (event, context) {
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  return {
    statusCode: 200,
    body: JSON.stringify({ clientId: paypalClientId }),
  };
};
