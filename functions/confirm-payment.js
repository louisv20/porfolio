const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { paymentIntentId } = JSON.parse(event.body);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "requires_confirmation") {
      await stripe.paymentIntents.confirm(paymentIntentId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: paymentIntent.status }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
