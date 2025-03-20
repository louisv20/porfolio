const mongoose = require('mongoose');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Define User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  subscriptionTier: { type: String, default: 'free' },
  basicQueryCount: { type: Number, default: 0 },
  advancedQueryCount: { type: Number, default: 0 },
  billingPeriodStart: { type: Date, default: Date.now },
  stripeCustomerId: { type: String },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

exports.handler = async (event) => {
  try {
    // Verify Stripe webhook signature
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Webhook signature verification failed' }),
      };
    }

    // Handle specific Stripe events
    const { type, data } = stripeEvent;
    const subscription = data.object;
    const userId = subscription.metadata?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId in metadata' }),
      };
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI1, { useNewUrlParser: true, useUnifiedTopology: true });

    let subscriptionTier;
    switch (subscription.plan.id) {
      case 'prod_RygeqYJzrD42xC': // Replace with your actual Stripe plan IDs
        subscriptionTier = 'basic';
        break;
      case 'prod_Ryge8f47UQFpj2':
        subscriptionTier = 'pro';
        break;
      case 'prod_Ryi0Bs9Lm7uP0u':
        subscriptionTier = 'unlimited';
        break;
      default:
        subscriptionTier = 'free';
    }

    if (type === 'customer.subscription.created' || type === 'customer.subscription.updated') {
      await User.findOneAndUpdate(
        { userId },
        {
          subscriptionTier,
          stripeCustomerId: subscription.customer,
          basicQueryCount: 0,
          advancedQueryCount: 0,
          billingPeriodStart: new Date(),
        },
        { upsert: true, new: true }
      );
    } else if (type === 'customer.subscription.deleted') {
      await User.findOneAndUpdate(
        { userId },
        { subscriptionTier: 'free' },
        { new: true }
      );
    }

    await mongoose.connection.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};