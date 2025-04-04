const mongoose = require('mongoose');  

const purchaseSchema = new mongoose.Schema({  
  user_id: {  
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'User',  
    required: true  
  },  
  stripe_payment_id: {  
    type: String,  
    required: true,  
    unique: true  
  },  
  amount: {  
    type: Number,  
    required: true  
  },  
  currency: {  
    type: String,  
    default: 'usd'  
  },  
  status: {  
    type: String,  
    enum: ['pending', 'completed', 'failed', 'refunded'],  
    default: 'pending'  
  },  
  purchase_date: {  
    type: Date,  
    default: Date.now  
  }  
});  

// Create indexes for performance  
purchaseSchema.index({ user_id: 1 });  
purchaseSchema.index({ stripe_payment_id: 1 });  

// Create the model only if it doesn't exist already  
const Purchase = mongoose.models.Purchase ||   
  mongoose.model('Purchase', purchaseSchema);  

module.exports = Purchase;  