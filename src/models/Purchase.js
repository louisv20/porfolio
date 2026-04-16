// src/models/Purchase.js  
const mongoose = require('mongoose');  

const purchaseSchema = new mongoose.Schema({  
  email: {  
    type: String,  
    required: true  
  },  
  // For non-trial purchases  
  stripe_payment_id: {  
    type: String,  
    // Make it not required and can be null  
    default: null  
  },  
  // For trial purchases with pending payment  
  stripe_payment_method_id: {  
    type: String,  
    default: null  
  },  
  // Add customer reference  
  stripe_customer_id: {  
    type: String  
  },  
  // Make amount optional with default value  
  amount: {  
    type: Number,  
    default: 1999  // Default to $29.99 in cents  
  },  
  // Make user_id completely optional  
  user_id: {  
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'User',  
    default: null  
  },  
  // Update status enum to include all trial states  
  status: {  
    type: String,  
    enum: ['pending', 'completed', 'failed', 'refunded', 'trial', 'trial_cancelled', 'trial_converted'],  
    default: 'pending'  
  },  
  // Trial-specific fields  
  is_trial: {  
    type: Boolean,  
    default: false  
  },  
  trial_expiry: {  
    type: Date,  
    default: null  
  },  
  trial_cancelled: {  
    type: Boolean,  
    default: false  
  },  
  auto_convert: {  
    type: Boolean,  
    default: true  
  },  
  // Standard timestamp fields  
  created_at: {  
    type: Date,  
    default: Date.now  
  },  
  updated_at: {  
    type: Date,  
    default: Date.now  
  }  
});  

// Update the updated_at field before saving  
purchaseSchema.pre('save', function(next) {  
  this.updated_at = new Date();  
  next();  
});  

module.exports = mongoose.model('Purchase', purchaseSchema);  