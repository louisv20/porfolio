const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { amount } = JSON.parse(event.body);

    // Validate the amount
    if (isNaN(amount) || amount < 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid amount. Minimum is 50 cents." }),
      };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      // Add metadata to make the transaction more identifiable in your dashboard
      metadata: {
        integration_check: "accept_a_payment",
        source: "Netlify serverless function",
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
