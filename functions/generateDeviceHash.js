// functions/generateDeviceHash.js  
const connectDb = require('../src/models/db');  
const DeviceHash = require('../src/models/DeviceHash');  
const { createDeviceHash } = require('../src/utils/fingerprint');  

exports.handler = async (event) => {  
  if (event.httpMethod !== 'POST') {  
    return { statusCode: 405, body: 'Method Not Allowed' };  
  }  

  try {  
    await connectDb();  
    const { deviceData } = JSON.parse(event.body);  
    
    if (!deviceData) {  
      return {  
        statusCode: 400,  
        body: JSON.stringify({ error: 'Missing device data' })  
      };  
    }  
    
    // Create device hash  
    const deviceHash = createDeviceHash(deviceData);  
    
    // Check if device already has access  
    const deviceRecord = await DeviceHash.findOne({ device_hash: deviceHash });  
    
    if (deviceRecord) {  
      // Check if record has a valid purchase or trial  
      return {  
        statusCode: 200,  
        body: JSON.stringify({  
          deviceHash,  
          hasPurchased: !!deviceRecord.purchase_id  
        })  
      };  
    }  
    
    return {  
      statusCode: 200,  
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