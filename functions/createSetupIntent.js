// functions/createSetupIntent.js  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const connectDb = require('../src/models/db');  
const Customer = require('../src/models/Customer');  

exports.handler = async (event) => {  
  if (event.httpMethod !== 'POST') {  
    return { statusCode: 405, body: 'Method Not Allowed' };  
  }  

  try {  
    await connectDb();  
    const { email } = JSON.parse(event.body);  
    
    if (!email) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Email is required' })  
      };  
    }  

    // Find or create a customer  
    let customer = await Customer.findOne({ email });  
    
    if (!customer) {  
      // Create Stripe customer  
      const stripeCustomer = await stripe.customers.create({  
        email  
      });  
      
      customer = new Customer({  
        email,  
        stripe_customer_id: stripeCustomer.id  
      });  
      
      await customer.save();  
    }  
    
    // Create a SetupIntent  
    const setupIntent = await stripe.setupIntents.create({  
      customer: customer.stripe_customer_id,  
      payment_method_types: ['card'],  
      usage: 'off_session', // Allow for future automatic payments  
      metadata: {  
        setup_for: 'trial_auto_conversion'  
      }  
    });  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify({  
        clientSecret: setupIntent.client_secret,  
        customerId: customer.stripe_customer_id  
      })  
    };  
  } catch (error) {  
    console.error('Error creating setup intent:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: 'Failed to create setup intent' })  
    };  
  }  
};  