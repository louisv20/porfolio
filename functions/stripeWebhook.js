const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const connectDb = require('../../../src/models/db');  
const Purchase = require('../../../src/models/Purchase');  
const DeviceHash = require('../../../src/models/DeviceHash');  

exports.handler = async (event) => {  
  const sig = event.headers['stripe-signature'];  
  let stripeEvent;  

  try {  
    stripeEvent = stripe.webhooks.constructEvent(  
      event.body,  
      sig,  
      process.env.STRIPE_WEBHOOK_SECRET  
    );  
  } catch (err) {  
    return {  
      statusCode: 400,  
      body: `Webhook Error: ${err.message}`  
    };  
  }  

  try {  
    // Connect to database  
    await connectDb();  

    // Handle different Stripe events  
    if (stripeEvent.type === 'payment_intent.succeeded') {  
      const paymentIntent = stripeEvent.data.object;  
      
      // Update purchase status to completed  
      await Purchase.findOneAndUpdate(  
        { stripe_payment_id: paymentIntent.id },  
        { status: 'completed' }  
      );  
    }  
    else if (stripeEvent.type === 'payment_intent.payment_failed') {  
      const paymentIntent = stripeEvent.data.object;  
      
      // Update purchase status to failed  
      await Purchase.findOneAndUpdate(  
        { stripe_payment_id: paymentIntent.id },  
        { status: 'failed' }  
      );  
    }  
    else if (stripeEvent.type === 'charge.refunded') {  
      const charge = stripeEvent.data.object;  
      
      // Get payment intent ID from charge  
      const paymentIntentId = charge.payment_intent;  
      
      // Update purchase to refunded  
      await Purchase.findOneAndUpdate(  
        { stripe_payment_id: paymentIntentId },  
        { status: 'refunded' }  
      );  
      
      // Optionally deactivate the device  
      const purchase = await Purchase.findOne({ stripe_payment_id: paymentIntentId });  
      if (purchase) {  
        await DeviceHash.updateMany(  
          { purchase_id: purchase._id },  
          { status: 'inactive' }  
        );  
      }  
    }  

    return {  
      statusCode: 200,  
      body: JSON.stringify({ received: true })  
    };  
  } catch (error) {  
    console.error('Webhook processing error:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: 'Webhook processing failed' })  
    };  
  }  
};  