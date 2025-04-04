const crypto = require('crypto');  
const connectDb = require('../../src/models/db');  
const DeviceHash = require('../../src/models/DeviceHash');  

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

    // Generate device hash using device characteristics  
    const deviceHash = crypto  
      .createHash('sha256')  
      .update(JSON.stringify(deviceData))  
      .digest('hex');  
    
    // Check if this device already has an active purchase  
    const existingDevice = await DeviceHash.findOne({  
      device_hash: deviceHash,  
      status: "active"  
    }).populate('purchase_id');  
    
    // If device already has an active purchase, return status  
    if (existingDevice && existingDevice.purchase_id.status === 'completed') {  
      // Update last access time  
      await DeviceHash.findOneAndUpdate(  
        { device_hash: deviceHash },  
        { last_access: new Date() }  
      );  
      
      return {  
        statusCode: 200,  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({   
          deviceHash,  
          hasPurchased: true  
        })  
      };  
    }  
    
    // No active purchase found for this device  
    return {  
      statusCode: 200,  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({   
        deviceHash,  
        hasPurchased: false  
      })  
    };  
  } catch (error) {  
    console.error('Error generating device hash:', error);  
    return {  
      statusCode: 500,  
      body: JSON.stringify({ error: 'Failed to generate device hash' })  
    };  
  }  
};  