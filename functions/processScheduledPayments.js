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
    
    const now = new Date();  
    console.log('Current time:', now.toISOString());  
    
    // Find all payment methods with scheduled payments due  
    console.log('Fetching payment methods from Stripe...');  
    const paymentMethods = await stripe.paymentMethods.list({  
      limit: 100 // Adjust as needed  
    });  
    
    console.log(`Found ${paymentMethods.data.length} total payment methods`);  
    
    // Log details of ALL payment methods for debugging  
    console.log('All payment methods:');  
    paymentMethods.data.forEach(method => {  
      console.log({  
        id: method.id,  
        type: method.type,  
        customer: method.customer,  
        hasMetadata: !!method.metadata,  
        metadata: method.metadata,  
        hasScheduledDate: !!method.metadata.scheduled_payment_date,  
        scheduledDate: method.metadata.scheduled_payment_date ? new Date(method.metadata.scheduled_payment_date).toISOString() : 'none',  
        isPastDue: method.metadata.scheduled_payment_date ? new Date(method.metadata.scheduled_payment_date) <= now : false  
      });  
    });  
    
    // Filter methods with scheduled dates in the past  
    console.log('Filtering payment methods due for charging...');  
    const dueMethods = paymentMethods.data.filter(method => {  
      // Check if metadata and scheduled_payment_date exist  
      if (!method.metadata || !method.metadata.scheduled_payment_date) {  
        console.log(`Method ${method.id} has no scheduled date`);  
        return false;  
      }  
      
      // Check if purchase_id exists  
      if (!method.metadata.purchase_id) {  
        console.log(`Method ${method.id} has no purchase_id`);  
        return false;  
      }  
      
      try {  
        // Parse date and compare as timestamps  
        const scheduledDate = new Date(method.metadata.scheduled_payment_date);  
        const nowTime = now.getTime();  
        const scheduledTime = scheduledDate.getTime();  
        
        console.log('Date comparison for', method.id, ':', {  
          scheduledDateStr: method.metadata.scheduled_payment_date,  
          scheduledTime,  
          nowTime,  
          difference: nowTime - scheduledTime,  
          isPastDue: scheduledTime <= nowTime  
        });  
        
        return scheduledTime <= nowTime;  
      } catch (error) {  
        console.error(`Error parsing date for method ${method.id}:`, error);  
        return false;  
      }  
    });  
    
    console.log(`Found ${dueMethods.length} payment methods due for charging`);  
    
    if (dueMethods.length === 0) {  
      console.log('No payment methods due for charging');  
      return {  
        statusCode: 200,  
        body: JSON.stringify({ message: 'No scheduled payments to process' })  
      };  
    }  
    
    // Log the payment methods found to be due  
    console.log('Due methods:');  
    dueMethods.forEach(method => {  
      console.log({  
        id: method.id,  
        customer: method.customer,  
        metadata: method.metadata,  
        scheduledDate: new Date(method.metadata.scheduled_payment_date).toISOString()  
      });  
    });  
    
    let successCount = 0;  
    let failureCount = 0;  
    const results = [];  
    
    for (const method of dueMethods) {  
      console.log(`Processing payment for method ${method.id}...`);  
      try {  
        // Get the purchase record using direct MongoDB query  
        const purchaseId = method.metadata.purchase_id;  
        console.log(`Looking up purchase with ID: ${purchaseId}`);  
        
        let purchaseObjectId;  
        try {  
          purchaseObjectId = new mongoose.Types.ObjectId(purchaseId);  
        } catch (error) {  
          console.error(`Invalid purchase ID format: ${purchaseId}`, error);  
          results.push({  
            id: method.id,  
            purchaseId,  
            status: 'error',  
            error: 'Invalid purchase ID format'  
          });  
          failureCount++;  
          continue;  
        }  
        
        const purchase = await purchasesCollection.findOne({ _id: purchaseObjectId });  
        
        if (!purchase) {  
          console.error(`Purchase not found for ID: ${purchaseId}`);  
          results.push({  
            id: method.id,  
            purchaseId,  
            status: 'error',  
            error: 'Purchase not found'  
          });  
          failureCount++;  
          continue;  
        }  
        
        console.log(`Found purchase:`, {  
          id: purchaseId,  
          email: purchase.email,  
          is_trial: purchase.is_trial,  
          auto_convert: purchase.auto_convert,  
          stripe_customer_id: purchase.stripe_customer_id  
        });  
        
        if (!purchase.is_trial || !purchase.auto_convert) {  
          console.log(`Skipping purchase ${purchaseId}: not a trial or auto-convert disabled`);  
          results.push({  
            id: method.id,  
            purchaseId,  
            status: 'skipped',  
            reason: !purchase.is_trial ? 'Not a trial' : 'Auto-convert disabled'  
          });  
          continue;  
        }  
        
        // Create the payment intent  
        console.log(`Creating payment intent for method ${method.id}...`);  
        const amount = parseInt(method.metadata.amount) || 1999;  
        console.log(`Charge amount: ${amount}`);  
        
        const paymentIntent = await stripe.paymentIntents.create({  
          amount: amount,  
          currency: method.metadata.currency || 'usd',  
          customer: purchase.stripe_customer_id,  
          payment_method: method.id,  
          off_session: true,  
          confirm: true,  
          description: method.metadata.description || 'AbbreviAI Premium - Trial Conversion',  
          metadata: {  
            device_hash: method.metadata.device_hash || '',  
            purchase_id: purchaseId  
          }  
        });  
        
        console.log(`Payment intent created: ${paymentIntent.id}, status: ${paymentIntent.status}`);  
        
        // Update purchase record using direct MongoDB query  
        await purchasesCollection.updateOne(  
          { _id: purchaseObjectId },  
          {   
            $set: {  
              status: 'completed',  
              is_trial: false,  
              stripe_payment_id: paymentIntent.id,  
              amount: amount,  
              updated_at: new Date()  
            }  
          }  
        );  
        
        console.log(`Purchase ${purchaseId} updated to completed status`);  
        
        // Clear the scheduled payment metadata  
        console.log(`Clearing scheduled payment metadata for method ${method.id}...`);  
        await stripe.paymentMethods.update(method.id, {  
          metadata: {  
            scheduled_payment_date: '',  
            device_hash: method.metadata.device_hash || '',  
            purchase_id: '',  
            amount: '',  
            currency: '',  
            description: ''  
          }  
        });  
        
        console.log(`Successfully charged payment method ${method.id} for purchase ${purchaseId}`);  
        results.push({  
          id: method.id,  
          purchaseId,  
          status: 'success',  
          paymentIntentId: paymentIntent.id  
        });  
        successCount++;  
      } catch (error) {  
        console.error(`Error processing payment for method ${method.id}:`, error);  
        results.push({  
          id: method.id,  
          error: error.message || 'Unknown error',  
          status: 'failed'  
        });  
        failureCount++;  
      }  
    }  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify({   
        message: `Processed ${dueMethods.length} scheduled payments`,  
        success: successCount,  
        failures: failureCount,  
        results  
      })  
    };  
  } catch (error) {  
    console.error('Error processing scheduled payments:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: error.message || 'Failed to process scheduled payments' })  
    };  
  }  
};  