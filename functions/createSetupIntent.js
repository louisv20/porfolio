// functions/createSetupIntent.js  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const connectDb = require('../src/models/db');  
const Customer = require('../src/models/Customer');  

exports.handler = async (event) => {  
  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://abbreviai.com', // or your specific domain
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400' // 24 hours
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {  
    return { 
      statusCode: 405, 
      headers: {
        'Access-Control-Allow-Origin': 'https://abbreviai.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };  
  }  

  try {  
    await connectDb();  
    const { email } = JSON.parse(event.body);  
    
    if (!email) {  
      return {  
        statusCode: 400,  
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({  
        clientSecret: setupIntent.client_secret,  
        customerId: customer.stripe_customer_id  
      })  
    };  
  } catch (error) {  
    console.error('Error creating setup intent:', error);  
    return {  
      statusCode: 500,  
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to create setup intent' })  
    };  
  }  
};