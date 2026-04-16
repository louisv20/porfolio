const mongoose = require('mongoose');  

const userSchema = new mongoose.Schema({  
  email: {  
    type: String,  
    required: true,  
    unique: true,  
    trim: true,  
    lowercase: true  
  },  
  stripe_customer_id: {  
    type: String,  
    required: true  
  },  
  created_at: {  
    type: Date,  
    default: Date.now  
  }  
});  

// Create the model only if it doesn't exist already  
const User = mongoose.models.User || mongoose.model('User', userSchema);  

module.exports = User;  