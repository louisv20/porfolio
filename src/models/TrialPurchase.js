// src/models/TrialPurchase.js  
const mongoose = require('mongoose');  

const trialPurchaseSchema = new mongoose.Schema({  
  email: {  
    type: String,  
    required: true  
  },  
  stripe_customer_id: {  
    type: String,  
    required: true  
  },  
  stripe_payment_method_id: {  
    type: String,  
    required: true  
  },  
  amount: {  
    type: Number,  
    default: 2999  // $29.99 in cents  
  },  
  status: {  
    type: String,  
    enum: ['trial', 'trial_cancelled', 'trial_converted'],  
    default: 'trial'  
  },  
  trial_expiry: {  
    type: Date,  
    required: true  
  },  
  trial_cancelled: {  
    type: Boolean,  
    default: false  
  },  
  auto_convert: {  
    type: Boolean,  
    default: true  
  },  
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
trialPurchaseSchema.pre('save', function(next) {  
  this.updated_at = new Date();  
  next();  
});  

module.exports = mongoose.model('TrialPurchase', trialPurchaseSchema);  