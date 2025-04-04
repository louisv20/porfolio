const mongoose = require('mongoose');  

const deviceHashSchema = new mongoose.Schema({  
  device_hash: {  
    type: String,  
    required: true,  
    unique: true  
  },  
  user_id: {  
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'User',  
    required: true  
  },  
  purchase_id: {  
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'Purchase',  
    required: true  
  },  
  status: {  
    type: String,  
    enum: ['active', 'inactive'],  
    default: 'active'  
  },  
  created_at: {  
    type: Date,  
    default: Date.now  
  },  
  last_access: {  
    type: Date,  
    default: Date.now  
  }  
});  

// Create indexes  
deviceHashSchema.index({ device_hash: 1 }, { unique: true });  
deviceHashSchema.index({ purchase_id: 1 });  

// Create the model only if it doesn't exist already  
const DeviceHash = mongoose.models.DeviceHash ||   
  mongoose.model('DeviceHash', deviceHashSchema);  

module.exports = DeviceHash;  