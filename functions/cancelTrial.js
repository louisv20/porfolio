const connectDb = require('../src/models/db');  
const Purchase = require('../src/models/Purchase');  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  

exports.handler = async (event) => {  
  if (event.httpMethod !== 'POST') {  
    return { statusCode: 405, body: 'Method Not Allowed' };  
  }  

  try {  
    await connectDb();  
    const { purchaseId } = JSON.parse(event.body);  
    
    if (!purchaseId) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Purchase ID is required' })  
      };  
    }  

    // Find the trial purchase  
    const purchase = await Purchase.findById(purchaseId);  
    
    if (!purchase) {  
      return {  
        statusCode: 404,  
        body: JSON.stringify({ error: 'Purchase not found' })  
      };  
    }  
    
    if (!purchase.is_trial) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'This is not a trial purchase' })  
      };  
    }  
    
    // Detach the payment method to prevent future charges  
    if (purchase.stripe_payment_method_id) {  
      try {  
        // Remove scheduled payment metadata  
        await stripe.paymentMethods.update(purchase.stripe_payment_method_id, {  
          metadata: {  
            scheduled_payment_date: '',  
            device_hash: '',  
            purchase_id: '',  
            amount: '',  
            currency: '',  
            description: ''  
          }  
        });  
      } catch (stripeError) {  
        console.log('Error updating payment method:', stripeError);  
        // Continue even if this fails  
      }  
    }  
    
    // Mark the trial as cancelled  
    purchase.status = 'cancelled';  
    purchase.auto_convert = false;  
    await purchase.save();  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify({  
        success: true,  
        message: 'Trial successfully cancelled'  
      })  
    };  
  } catch (error) {  
    console.error('Error cancelling trial:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: 'Failed to cancel trial' })  
    };  
  }  
};  