// src/models/Customer.js  
const mongoose = require('mongoose');  

const customerSchema = new mongoose.Schema({  
  email: {  
    type: String,  
    required: true,  
    unique: true  
  },  
  stripe_customer_id: {  
    type: String,  
    required: true  
  },  
  default_payment_method_id: {  
    type: String,  
    default: null  
  },  
  created_at: {  
    type: Date,  
    default: Date.now  
  }  
});  

// Add a method to easily find or create a customer  
customerSchema.statics.findOrCreate = async function(email) {  
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  
  
  // Try to find existing customer  
  let customer = await this.findOne({ email });  
  
  // If customer doesn't exist, create one  
  if (!customer) {  
    // Create in Stripe  
    const stripeCustomer = await stripe.customers.create({  
      email  
    });  
    
    // Create in our database  
    customer = new this({  
      email,  
      stripe_customer_id: stripeCustomer.id  
    });  
    
    await customer.save();  
  }  
  
  return customer;  
};  

module.exports = mongoose.model('Customer', customerSchema); 