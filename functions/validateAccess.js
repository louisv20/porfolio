// functions/validateAccess.js  
const connectDb = require('../src/models/db');  
const DeviceHash = require('../src/models/DeviceHash');  
const Purchase = require('../src/models/Purchase');  
const { createDeviceHash } = require('../src/utils/fingerprint');  

exports.handler = async (event) => {  
  // Only allow POST requests  
  if (event.httpMethod !== 'POST') {  
    return {  
      statusCode: 405,  
      body: JSON.stringify({ error: 'Method Not Allowed' })  
    };  
  }  

  try {  
    let body;  
    try {  
      body = JSON.parse(event.body);  
    } catch (error) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Invalid JSON body' })  
      };  
    }  

    // Check for device data  
    if (!body.deviceData) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Missing device data' })  
      };  
    }  

    // Generate device hash  
    const deviceHash = createDeviceHash(body.deviceData);  

    // Connect to database  
    await connectDb();  

    // Find device hash in database  
    const deviceRecord = await DeviceHash.findOne({ device_hash: deviceHash });  

    // If device is not found, return invalid  
    if (!deviceRecord || !deviceRecord.purchase_id) {  
      return {  
        statusCode: 200,  
        body: JSON.stringify({  
          valid: false,  
          error: 'No purchase found for this device'  
        })  
      };  
    }  

    // Find associated purchase  
    const purchase = await Purchase.findById(deviceRecord.purchase_id);  

    // If purchase is not found, return invalid  
    if (!purchase) {  
      return {  
        statusCode: 200,  
        body: JSON.stringify({  
          valid: false,  
          error: 'Purchase record not found'  
        })  
      };  
    }  

    // Handle trial purchases  
    if (purchase.is_trial) {  
      const now = new Date();  
      const trialExpiry = new Date(purchase.trial_expiry);  
      
      // Check if trial is still valid  
      if (now > trialExpiry) {  
        // Trial has expired  
        return {  
          statusCode: 200,  
          body: JSON.stringify({  
            valid: false,  
            is_trial: true,  
            trial_expired: true,  
            trial_expiry: purchase.trial_expiry,  
            trial_cancelled: purchase.trial_cancelled || false,  
            error: 'Trial period has expired'  
          })  
        };  
      }  
      
      // Trial is still valid  
      return {  
        statusCode: 200,  
        body: JSON.stringify({  
          valid: true,  
          purchaseDate: purchase.created_at,  
          is_trial: true,  
          trial_expiry: purchase.trial_expiry,  
          trial_cancelled: purchase.trial_cancelled || false  
        })  
      };  
    }  
    
    // For regular purchases, check status  
    if (purchase.status === 'completed') {  
      return {  
        statusCode: 200,  
        body: JSON.stringify({  
          valid: true,  
          purchaseDate: purchase.created_at  
        })  
      };  
    } else if (purchase.status === 'refunded') {  
      return {  
        statusCode: 200,  
        body: JSON.stringify({  
          valid: false,  
          error: 'Purchase has been refunded'  
        })  
      };  
    } else {  
      return {  
        statusCode: 200,  
        body: JSON.stringify({  
          valid: false,  
          error: `Invalid purchase status: ${purchase.status}`  
        })  
      };  
    }  
  } catch (error) {  
    console.error('Access validation error:', error);  
    
    return {  
      statusCode: 500,  
      body: JSON.stringify({  
        valid: false,  
        error: 'Server error validating access'  
      })  
    };  
  }  
};  