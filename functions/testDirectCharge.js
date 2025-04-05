// functions/testDirectCharge.js  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const connectDb = require('../src/models/db');  
const mongoose = require('mongoose');  

exports.handler = async (event) => {  
  try {  
    if (event.httpMethod !== 'POST') {  
      return { statusCode: 405, body: 'Method Not Allowed' };  
    }  

    const { paymentMethodId, purchaseId } = JSON.parse(event.body);  
    
    if (!paymentMethodId || !purchaseId) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Missing required fields' })  
      };  
    }  
    
    await connectDb();  
    const db = mongoose.connection.db;  
    const purchasesCollection = db.collection('purchases');  
    
    // Get purchase record  
    let purchaseObjectId;  
    try {  
      purchaseObjectId = new mongoose.Types.ObjectId(purchaseId);  
    } catch (error) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Invalid purchase ID format' })  
      };  
    }  
    
    const purchase = await purchasesCollection.findOne({ _id: purchaseObjectId });  
    
    if (!purchase) {  
      return {  
        statusCode: 404,  
        body: JSON.stringify({ error: 'Purchase not found' })  
      };  
    }  
    
    // Create payment intent  
    const paymentIntent = await stripe.paymentIntents.create({  
      amount: 1999,  
      currency: 'usd',  
      customer: purchase.stripe_customer_id,  
      payment_method: paymentMethodId,  
      off_session: true,  
      confirm: true,  
      description: 'Test direct charge'  
    });  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify({  
        success: true,  
        paymentIntentId: paymentIntent.id,  
        status: paymentIntent.status  
      })  
    };  
  } catch (error) {  
    console.error('Error processing direct charge:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: error.message })  
    };  
  }  
};  