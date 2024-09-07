exports.handler = async function (event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ publicKey: process.env.EPAYCO_PUBLIC_KEY }),
  };
};
