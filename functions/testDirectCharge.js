// functions/testDirectCharge.js  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const connectDb = require('../src/models/db');  
const mongoose = require('mongoose');  
const DeviceHash = require('../src/models/DeviceHash');

exports.handler = async (event) => {  
  try {  
    if (event.httpMethod !== 'POST') {  
      return { statusCode: 405, body: 'Method Not Allowed' };  
    }  

    const { paymentMethodId, purchaseId, deviceData, isTrialConversion } = JSON.parse(event.body);  
    
    // For trial conversion, we need purchaseId but not necessarily paymentMethodId
    // as we'll get it from the trial purchase record
    if (!purchaseId || (!paymentMethodId && !isTrialConversion)) {  
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
    
    // If this is a trial conversion, we need to handle it differently
    if (isTrialConversion) {
      console.log('Processing trial conversion for purchase ID:', purchaseId);
    
      // Get payment method ID from the trial purchase
      const actualPaymentMethodId = purchase.stripe_payment_method_id || paymentMethodId;
    
      if (!actualPaymentMethodId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No payment method found for this trial' })
        };
      }
    
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1999,
        currency: 'usd',
        customer: purchase.stripe_customer_id,
        payment_method: actualPaymentMethodId,
        off_session: true,
        confirm: true,
        description: 'Trial conversion to full purchase'
      });
    
      if (paymentIntent.status === 'succeeded') {
        // Update the existing trial record
        await purchasesCollection.updateOne(
          { _id: purchaseObjectId },
          {
            $set: {
              status: 'completed', // Update status to completed
              stripe_payment_id: paymentIntent.id, // Store the payment intent ID
              is_trial: false, // Mark trial as converted
              auto_convert: false, // Disable auto-conversion
              updated_at: new Date()
            }
          }
        );
    
        // If device data is provided, update the device hash to point to the existing purchase
        if (deviceData) {
          const { createDeviceHash } = require('../src/utils/fingerprint');
          const deviceHash = createDeviceHash(deviceData);
    
          // Update device hash to point to the existing purchase
          await mongoose.connection.db.collection('devicehashes').updateOne(
            { device_hash: deviceHash },
            {
              $set: {
                purchase_id: purchaseObjectId,
                updated_at: new Date()
              }
            },
            { upsert: true }
          );
        }
    
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'Trial successfully converted to full purchase',
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            purchaseId: purchaseObjectId.toString(),
            redirect: true,
            redirect_url: 'https://luisgcastro.com/success.html'
          })
        };
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: 'Payment failed',
            status: paymentIntent.status
          })
        };
      }
    } else {
      // Regular direct charge (not a trial conversion)
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
    }
  } catch (error) {  
    console.error('Error processing direct charge:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: error.message })  
    };  
  }  
};
