const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
const connectDb = require('../src/models/db');  
const Purchase = require('../src/models/Purchase');  

exports.handler = async (event) => {  
  try {  
    await connectDb();  
    
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
        // Get the purchase record  
        const purchaseId = method.metadata.purchase_id;  
        const purchase = await Purchase.findById(purchaseId);  
        
        if (!purchase || !purchase.is_trial || !purchase.auto_convert) {  
          // Skip if no purchase, not a trial, or auto-convert is disabled  
          continue;  
        }  
        
        // Create the payment intent  
        const paymentIntent = await stripe.paymentIntents.create({  
          amount: parseInt(method.metadata.amount) || 2999,  
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
        
        // Update purchase record  
        purchase.status = 'completed';  
        purchase.is_trial = false;  
        purchase.stripe_payment_id = paymentIntent.id;  
        purchase.amount = parseInt(method.metadata.amount) || 2999;  
        await purchase.save();  
        
        // Clear the scheduled payment metadata  
        await stripe.paymentMethods.update(method.id, {  
          metadata: {  
            scheduled_payment_date: '',  
            device_hash: '',  
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