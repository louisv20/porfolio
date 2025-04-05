// functions/activateTrialWithPayment.js  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const connectDb = require('../src/models/db');  
const Purchase = require('../src/models/Purchase');  
const DeviceHash = require('../src/models/DeviceHash');  
const Customer = require('../src/models/Customer');  

exports.handler = async (event) => {  
  if (event.httpMethod !== 'POST') {  
    return { statusCode: 405, body: 'Method Not Allowed' };  
  }  

  try {  
    await connectDb();  
    const { email, deviceHash, setupIntentId, paymentMethodId } = JSON.parse(event.body);  
    
    if (!email || !deviceHash || !setupIntentId || !paymentMethodId) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Missing required fields' })  
      };  
    }  

    // Verify the setup intent was completed successfully  
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);  
    if (setupIntent.status !== 'succeeded') {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Payment method setup was not completed' })  
      };  
    }  
    
    // Get or create customer  
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
    
    // Attach payment method to customer  
    await stripe.paymentMethods.attach(paymentMethodId, {  
      customer: customer.stripe_customer_id  
    });  
    
    // Set as default payment method  
    await stripe.customers.update(customer.stripe_customer_id, {  
      invoice_settings: {  
        default_payment_method: paymentMethodId  
      }  
    });  
    
    // Calculate trial expiry (7 days from now)  
    const trialExpiry = new Date();  
    trialExpiry.setDate(trialExpiry.getDate() + 7);  
    
    // Create a trial purchase record with proper fields  
    const purchase = new Purchase({  
      email,  
      stripe_customer_id: customer.stripe_customer_id,  
      stripe_payment_method_id: paymentMethodId,  
      status: 'trial',  
      is_trial: true,  
      trial_expiry: trialExpiry,  
      auto_convert: true,  
      amount: 2999  // Setting the amount even though it's not charged yet  
    });  
    
    await purchase.save();  
    
    // Create or update device hash record  
    const deviceRecord = await DeviceHash.findOne({ device_hash: deviceHash });  
    if (deviceRecord) {  
      deviceRecord.purchase_id = purchase._id;  
      await deviceRecord.save();  
    } else {  
      const newDeviceRecord = new DeviceHash({  
        device_hash: deviceHash,  
        purchase_id: purchase._id,  
        created_at: new Date()  
      });  
      await newDeviceRecord.save();  
    }  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify({  
        success: true,  
        message: 'Trial activated with payment method',  
        is_trial: true,  
        trial_expiry: trialExpiry,  
        purchase_id: purchase._id  
      })  
    };  
  } catch (error) {  
    console.error('Error activating trial with payment:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: error.message || 'Failed to activate trial' })  
    };  
  }  
};  