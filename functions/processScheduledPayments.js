// processScheduledPayments.js  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const mongoose = require('mongoose');  
const connectDb = require('../src/models/db');  

exports.handler = async (event) => {  
  console.log('Starting processScheduledPayments function');  
  try {  
    await connectDb();  
    console.log('Database connected');  
    
    const db = mongoose.connection.db;  
    const purchasesCollection = db.collection('purchases');  
    
    // Check if this is a request to process a specific purchase
    let singlePurchaseId = null;
    if (event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body);
        if (body.purchaseId && body.singlePurchase) {
          singlePurchaseId = body.purchaseId;
          console.log(`Processing single purchase: ${singlePurchaseId}`);
        }
      } catch (error) {
        console.error('Error parsing request body:', error);
      }
    }
    
    const now = new Date();  
    console.log('Current time:', now.toISOString());  
    
    let expiredTrials = [];
    
    // If processing a single purchase
    if (singlePurchaseId) {
      try {
        const purchaseObjectId = new mongoose.Types.ObjectId(singlePurchaseId);
        const purchase = await purchasesCollection.findOne({ _id: purchaseObjectId });
        
        if (purchase && purchase.is_trial && purchase.status === 'trial') {
          console.log(`Found single purchase to process: ${singlePurchaseId}`);
          expiredTrials = [purchase];
        } else {
          console.log(`Purchase ${singlePurchaseId} is not a valid trial or has already been processed`);
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Not a valid trial or already processed' })
          };
        }
      } catch (error) {
        console.error(`Error finding purchase ${singlePurchaseId}:`, error);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid purchase ID format' })
        };
      }
    } else {
      // Primary approach: Find expired trials in the database first  
      console.log('Finding expired trials in database...');  
      expiredTrials = await purchasesCollection.find({  
        is_trial: true,  
        auto_convert: true,  
        trial_expiry: { $lte: now },  
        status: 'trial' // Only process trials that haven't been converted yet  
      }).toArray();  
    }
    
    console.log(`Found ${expiredTrials.length} expired trials in database`);  
    
    if (expiredTrials.length === 0) {  
      // Fallback to the old method: Check for payment methods with scheduled dates  
      console.log('No expired trials found in database, checking Stripe payment methods...');  
      
      const paymentMethods = await stripe.paymentMethods.list({  
        limit: 100  
      });  
      
      console.log(`Found ${paymentMethods.data.length} total payment methods in Stripe`);  
      
      // Filter methods with scheduled dates in the past  
      const dueMethods = paymentMethods.data.filter(method => {  
        if (!method.metadata || !method.metadata.scheduled_payment_date || !method.metadata.purchase_id) {  
          return false;  
        }  
        
        try {  
          const scheduledDate = new Date(method.metadata.scheduled_payment_date);  
          return scheduledDate <= now;  
        } catch (error) {  
          console.error(`Error parsing date for method ${method.id}:`, error);  
          return false;  
        }  
      });  
      
      console.log(`Found ${dueMethods.length} payment methods due for charging via metadata`);  
      
      if (dueMethods.length === 0) {  
        console.log('No payment methods due for charging');  
        return {  
          statusCode: 200,  
          body: JSON.stringify({ message: 'No scheduled payments to process' })  
        };  
      }  
      
      // Process payment methods from Stripe metadata (your original logic)  
      // ... rest of the original code for processing dueMethods  
      
    } else {  
      // Process the expired trials from the database  
      console.log('Processing expired trials from database...');  
      
      let successCount = 0;  
      let failureCount = 0;  
      const results = [];  
      
      for (const purchase of expiredTrials) {  
        const purchaseId = purchase._id.toString();  
        const paymentMethodId = purchase.stripe_payment_method_id;  
        
        console.log(`Processing expired trial for purchase ${purchaseId} with payment method ${paymentMethodId}`);  
        
        try {  
          // Verify the payment method still exists  
          let paymentMethod;  
          try {  
            paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);  
            console.log(`Found payment method ${paymentMethodId} for customer ${purchase.stripe_customer_id}`);  
          } catch (error) {  
            console.error(`Payment method ${paymentMethodId} not found:`, error);  
            results.push({  
              purchaseId,  
              paymentMethodId,  
              status: 'error',  
              error: 'Payment method not found'  
            });  
            failureCount++;  
            continue;  
          }  
          
          // Create payment intent  
          console.log(`Creating payment intent for method ${paymentMethodId}...`);  
          const amount = purchase.amount || 1999;  
          
          const paymentIntent = await stripe.paymentIntents.create({  
            amount: amount,  
            currency: 'usd',  
            customer: purchase.stripe_customer_id,  
            payment_method: paymentMethodId,  
            off_session: true,  
            confirm: true,  
            description: 'AbbreviAI Premium - Trial Conversion',  
            metadata: {  
              purchase_id: purchaseId  
            }  
          });  
          
          console.log(`Payment intent created: ${paymentIntent.id}, status: ${paymentIntent.status}`);  
          
          // Update purchase record  
          await purchasesCollection.updateOne(  
            { _id: purchase._id },  
            {  
              $set: {  
                status: 'completed',  
                is_trial: false,  
                stripe_payment_id: paymentIntent.id,  
                updated_at: new Date()  
              }  
            }  
          );  
          
          console.log(`Purchase ${purchaseId} updated to completed status`);  
          
          // Update payment method metadata for consistency  
          console.log(`Updating payment method metadata...`);  
          await stripe.paymentMethods.update(paymentMethodId, {  
            metadata: {  
              purchase_id: purchaseId  
            }  
          });  
          
          console.log(`Successfully charged payment method ${paymentMethodId} for purchase ${purchaseId}`);  
          results.push({  
            purchaseId,  
            paymentMethodId,  
            status: 'success',  
            paymentIntentId: paymentIntent.id  
          });  
          successCount++;  
        } catch (error) {  
          console.error(`Error processing payment for purchase ${purchaseId}:`, error);  
          results.push({  
            purchaseId,  
            paymentMethodId: purchase.stripe_payment_method_id,  
            error: error.message || 'Unknown error',  
            status: 'failed'  
          });  
          failureCount++;  
        }  
      }  
      
      return {  
        statusCode: 200,  
        body: JSON.stringify({  
          message: `Processed ${expiredTrials.length} expired trials`,  
          success: successCount,  
          failures: failureCount,  
          results  
        })  
      };  
    }  
  } catch (error) {  
    console.error('Error processing scheduled payments:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: error.message || 'Failed to process scheduled payments' })  
    };  
  }  
};
