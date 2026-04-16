// src/utils/fingerprint.js  
const crypto = require('crypto');  

/**  
 * Creates a consistent hash from device data for fingerprinting  
 * @param {Object} deviceData - Device information collected from the browser  
 * @returns {string} - A unique device hash  
 */  
const createDeviceHash = (deviceData) => {  
  // Extract the most stable device characteristics  
  const {  
    userAgent = '',  
    platform = '',  
    screenWidth = '',  
    screenHeight = '',  
    timezone = '',  
    language = ''  
  } = deviceData;  
  
  // Create a string combining the most relevant and stable attributes  
  // Avoid using values that change frequently like IP addresses  
  const deviceString = `${userAgent}|${platform}|${screenWidth}x${screenHeight}|${timezone}|${language}`;  
  
  // Create SHA-256 hash of the device string  
  const hash = crypto.createHash('sha256')  
    .update(deviceString)  
    .digest('hex');  
  
  return hash;  
};  

/**  
 * Simplified version for basic validation  
 * Useful for comparing device hashes without full device data  
 */  
const validateDeviceHash = (deviceHash, deviceData) => {  
  const generatedHash = createDeviceHash(deviceData);  
  return deviceHash === generatedHash;  
};  

module.exports = {  
  createDeviceHash,  
  validateDeviceHash  
};  