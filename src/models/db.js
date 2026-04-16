const mongoose = require('mongoose');  

let cachedConnection = null;  

const connectDb = async () => {  
  if (cachedConnection) {  
    return cachedConnection;  
  }  

  // Configure mongoose options  
  mongoose.set('strictQuery', false);  
  
  // Connect to MongoDB  
  const conn = await mongoose.connect(process.env.MONGODB_URI1, {  
    serverSelectionTimeoutMS: 5000,  
    maxPoolSize: 10 // Recommended for serverless  
  });  

  cachedConnection = conn;  
  return conn;  
};  

module.exports = connectDb;  