// functions/activateTrialWithPayment.js - Complete rewrite  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const mongoose = require('mongoose');  
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

    // Verify the setup intent  
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
      const stripeCustomer = await stripe.customers.create({ email });  
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
    trialExpiry.setMinutes(trialExpiry.getMinutes() + 5);
    
    
    // CRITICAL CHANGE: Insert directly into the database  
    // This bypasses Mongoose validation entirely  
    const db = mongoose.connection.db;  
    const purchasesCollection = db.collection('purchases');  
    
    const purchaseDoc = {  
      email,  
      stripe_customer_id: customer.stripe_customer_id,  
      stripe_payment_method_id: paymentMethodId,  
      status: 'trial',  
      is_trial: true,  
      trial_expiry: trialExpiry,  
      auto_convert: true,  
      amount: 1999,  
      created_at: new Date(),  
      updated_at: new Date()  
    };  
    
    const result = await purchasesCollection.insertOne(purchaseDoc);  
    const purchaseId = result.insertedId;  
    
    // Create or update device hash record using the raw ObjectId  
    const deviceRecord = await DeviceHash.findOne({ device_hash: deviceHash });  
    if (deviceRecord) {  
      // Use the raw MongoDB driver to update  
      await mongoose.connection.db.collection('devicehashes').updateOne(  
        { device_hash: deviceHash },  
        { $set: { purchase_id: purchaseId, updated_at: new Date() } }  
      );  
    } else {  
      // Use the raw MongoDB driver to insert  
      await mongoose.connection.db.collection('devicehashes').insertOne({  
        device_hash: deviceHash,  
        purchase_id: purchaseId,  
        created_at: new Date()  
      });  
    }  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify({  
        success: true,  
        message: 'Trial activated with payment method',  
        is_trial: true,  
        trial_expiry: trialExpiry,  
        purchase_id: purchaseId.toString()  
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