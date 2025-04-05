const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const mongoose = require('mongoose');  
const connectDb = require('../src/models/db');  

exports.handler = async (event) => {  
  try {  
    await connectDb();  
    const db = mongoose.connection.db;  
    const purchasesCollection = db.collection('purchases');  
    
    const now = new Date();  
    
    // Find all payment methods with scheduled payments due  
    const paymentMethods = await stripe.paymentMethods.list({  
      limit: 100 // Adjust as needed  
    });  
    
    const dueMethods = paymentMethods.data.filter(method => {  
      if (!method.metadata.scheduled_payment_date) return false;  
      
      const scheduledDate = new Date(method.metadata.scheduled_payment_date);  
      return scheduledDate <= now && method.metadata.purchase_id;  
    });  
    
    for (const method of dueMethods) {  
      try {  
        // Get the purchase record using direct MongoDB query  
        const purchaseId = method.metadata.purchase_id;  
        let purchaseObjectId;  
        
        try {  
          purchaseObjectId = new mongoose.Types.ObjectId(purchaseId);  
        } catch (error) {  
          console.error(`Invalid purchase ID format: ${purchaseId}`);  
          continue;  
        }  
        
        const purchase = await purchasesCollection.findOne({ _id: purchaseObjectId });  
        
        if (!purchase || !purchase.is_trial || !purchase.auto_convert) {  
          // Skip if no purchase, not a trial, or auto-convert is disabled  
          continue;  
        }  
        
        // Create the payment intent  
        const paymentIntent = await stripe.paymentIntents.create({  
          amount: parseInt(method.metadata.amount) || 1999,  
          currency: method.metadata.currency || 'usd',  
          customer: purchase.stripe_customer_id,  
          payment_method: method.id,  
          off_session: true,  
          confirm: true,  
          description: method.metadata.description || 'AbbreviAI Premium - Trial Conversion',  
          metadata: {  
            device_hash: method.metadata.device_hash,  
            purchase_id: purchaseId  
          }  
        });  
        
        // Update purchase record using direct MongoDB query  
        await purchasesCollection.updateOne(  
          { _id: purchaseObjectId },  
          {   
            $set: {  
              status: 'completed',  
              is_trial: false,  
              stripe_payment_id: paymentIntent.id,  
              amount: parseInt(method.metadata.amount) || 1999,  
              updated_at: new Date()  
            }  
          }  
        );  
        
        // Clear the scheduled payment metadata  
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
      } catch (error) {  
        console.error(`Error processing payment for method ${method.id}:`, error);  
        // Continue with other payment methods  
      }  
    }  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify({ message: `Processed ${dueMethods.length} scheduled payments` })  
    };  
  } catch (error) {  
    console.error('Error processing scheduled payments:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: 'Failed to process scheduled payments' })  
    };  
  }  
};  