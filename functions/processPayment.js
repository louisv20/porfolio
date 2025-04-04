const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const connectDb = require('../src/models/db');  
const User = require('../src/models/user');  
const Purchase = require('../src/models/purchase');  
const DeviceHash = require('../src/models/devicehash');  

exports.handler = async (event, context) => {  
  // Only allow POST method  
  if (event.httpMethod !== 'POST') {  
    return { statusCode: 405, body: 'Method Not Allowed' };  
  }  

  try {  
    // Connect to database  
    await connectDb();  

    // Parse request body  
    const data = JSON.parse(event.body);  
    const { paymentMethodId, email, deviceHash } = data;  

    if (!paymentMethodId || !email || !deviceHash) {  
      return {   
        statusCode: 400,   
        body: JSON.stringify({   
          error: 'Payment method ID, email, and device hash are required'   
        })   
      };  
    }  

    // Create or get customer in Stripe  
    let customer;  
    try {  
      const customers = await stripe.customers.list({ email });  
      customer = customers.data.length > 0 ? customers.data[0] : null;  
      
      if (!customer) {  
        customer = await stripe.customers.create({  
          email,  
          payment_method: paymentMethodId  
        });  
      } else {  
        await stripe.paymentMethods.attach(paymentMethodId, {  
          customer: customer.id  
        });  
        
        // Set as default payment method  
        await stripe.customers.update(customer.id, {  
          invoice_settings: {  
            default_payment_method: paymentMethodId  
          }  
        });  
      }  
    } catch (error) {  
      console.error('Error with customer creation:', error);  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Invalid payment information' })  
      };  
    }  

    // Create a payment intent  
    const paymentIntent = await stripe.paymentIntents.create({  
      amount: 1999, // $29.99 in cents  
      currency: 'usd',  
      customer: customer.id,  
      payment_method: paymentMethodId,  
      confirm: true,  
      description: 'Chrome Extension Access',  
      metadata: {  
        device_hash: deviceHash  
      }  
    });  

    // Find or create user in our database  
    let user = await User.findOne({ email });  
    
    if (!user) {  
      user = await User.create({  
        email,  
        stripe_customer_id: customer.id  
      });  
    }  

    // Create purchase record  
    const purchase = await Purchase.create({  
      user_id: user._id,  
      stripe_payment_id: paymentIntent.id,  
      amount: paymentIntent.amount / 100, // Convert from cents  
      currency: paymentIntent.currency,  
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',  
      purchase_date: new Date()  
    });  

    // Create or update device hash  
    const existingDevice = await DeviceHash.findOne({ device_hash: deviceHash });  
    
    if (existingDevice) {  
      // Update existing device  
      await DeviceHash.findOneAndUpdate(  
        { device_hash: deviceHash },  
        {  
          user_id: user._id,  
          purchase_id: purchase._id,  
          status: 'active',  
          last_access: new Date()  
        }  
      );  
    } else {  
      // Create new device hash entry  
      await DeviceHash.create({  
        device_hash: deviceHash,  
        user_id: user._id,  
        purchase_id: purchase._id,  
        status: 'active',  
        created_at: new Date(),  
        last_access: new Date()  
      });  
    }  

    // Return success with purchase details  
    return {  
      statusCode: 200,  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({  
        success: true,  
        payment: {  
          id: paymentIntent.id,  
          status: paymentIntent.status  
        }  
      })  
    };  
  } catch (error) {  
    console.error('Error processing payment:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: error.message || 'Failed to process payment' })  
    };  
  }  
}; 