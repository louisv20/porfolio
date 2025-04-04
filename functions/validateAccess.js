const crypto = require('crypto');  
const connectDb = require('../src/models/db');  
const DeviceHash = require('../src/models/devicehash');  
const Purchase = require('../src/models/purchase');  

exports.handler = async (event, context) => {  
  // Only allow POST method  
  if (event.httpMethod !== 'POST') {  
    return { statusCode: 405, body: 'Method Not Allowed' };  
  }  
  
  try {  
    // Connect to database  
    await connectDb();  
    
    // Parse request body  
    const data = JSON.parse(event.body);  
    const { deviceData } = data;  
    
    if (!deviceData) {  
      return {   
        statusCode: 400,   
        body: JSON.stringify({ error: 'Device data is required' })   
      };  
    }  
    
    // Generate device hash  
    const deviceHash = crypto  
      .createHash('sha256')  
      .update(JSON.stringify(deviceData))  
      .digest('hex');  
    
    // Find this device in our database  
    const device = await DeviceHash.findOne({ device_hash: deviceHash })  
      .populate('purchase_id');  
    
    if (!device) {  
      return {  
        statusCode: 404,  
        body: JSON.stringify({   
          valid: false,   
          error: 'Device not registered'   
        })  
      };  
    }  
    
    // Check if the purchase is completed  
    if (!device.purchase_id || device.purchase_id.status !== 'completed') {  
      return {  
        statusCode: 403,   
        body: JSON.stringify({   
          valid: false,   
          error: 'No valid purchase found for this device'   
        })  
      };  
    }  
    
    // If the device is inactive (e.g., banned), block access  
    if (device.status !== 'active') {  
      return {  
        statusCode: 403,   
        body: JSON.stringify({   
          valid: false,   
          error: 'Device access has been deactivated'   
        })  
      };  
    }  
    
    // Update last access time  
    await DeviceHash.findOneAndUpdate(  
      { device_hash: deviceHash },  
      { last_access: new Date() }  
    );  
    
    // All checks passed, access is valid  
    return {  
      statusCode: 200,  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({   
        valid: true,  
        purchaseDate: device.purchase_id.purchase_date  
      })  
    };  
  } catch (error) {  
    console.error('Error validating access:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({   
        valid: false,   
        error: 'Failed to validate access'   
      })  
    };  
  }  
};  