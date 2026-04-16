const connectDb = require('../src/models/db');  
const mongoose = require('mongoose');  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  

exports.handler = async (event) => {  
  console.log('Starting cancelTrial function');  
  if (event.httpMethod !== 'POST') {  
    return { statusCode: 405, body: 'Method Not Allowed' };  
  }  

  try {  
    await connectDb();  
    const { purchaseId } = JSON.parse(event.body);  
    
    console.log(`Attempting to cancel trial with purchaseId: ${purchaseId}`);  
    
    if (!purchaseId) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Purchase ID is required' })  
      };  
    }  

    // Convert string ID to MongoDB ObjectId  
    let objectId;  
    try {  
      objectId = new mongoose.Types.ObjectId(purchaseId);  
      console.log(`Converted to ObjectId: ${objectId}`);  
    } catch (err) {  
      console.error(`Invalid purchaseId format: ${purchaseId}`, err);  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Invalid purchase ID format' })  
      };  
    }  

    // Use direct MongoDB access instead of Mongoose model  
    const db = mongoose.connection.db;  
    const purchasesCollection = db.collection('purchases');  
    
    // Find the trial purchase  
    const purchase = await purchasesCollection.findOne({ _id: objectId });  
    
    console.log(`Purchase lookup result:`, purchase ? 'Found' : 'Not found');  
    
    if (!purchase) {  
      // For debugging, list first few purchases in DB  
      const samplePurchases = await purchasesCollection.find({}).limit(3).toArray();  
      console.log('Sample purchases in DB:', samplePurchases.map(p => ({   
        id: p._id.toString(),  
        email: p.email,  
        status: p.status  
      })));  
      
      return {  
        statusCode: 404,  
        body: JSON.stringify({ error: 'Purchase not found' })  
      };  
    }  
    
    console.log(`Purchase details: `, {  
      id: purchase._id.toString(),  
      email: purchase.email,  
      is_trial: purchase.is_trial,  
      status: purchase.status,  
      payment_method: purchase.stripe_payment_method_id  
    });  
    
    if (!purchase.is_trial) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'This is not a trial purchase' })  
      };  
    }  
    
    // Detach the payment method to prevent future charges  
    if (purchase.stripe_payment_method_id) {  
      try {  
        console.log(`Updating payment method ${purchase.stripe_payment_method_id} to clear metadata`);  
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
    
    // Mark the trial as cancelled using direct MongoDB update  
    console.log(`Marking trial as cancelled`);  
    await purchasesCollection.updateOne(  
      { _id: objectId },  
      {   
        $set: {   
          status: 'cancelled',  
          auto_convert: false,  
          updated_at: new Date()  
        }   
      }  
    );  
    
    console.log(`Trial successfully cancelled`);  
    
    return {  
      statusCode: 200,  
      body: JSON.stringify({  
        success: true,  
        message: 'Trial successfully cancelled',
        status: 'cancelled'  
      })  
    };  
  } catch (error) {  
    console.error('Error cancelling trial:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: error.message || 'Failed to cancel trial' })  
    };  
  }  
};  