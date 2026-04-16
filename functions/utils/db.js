const mongoose = require('mongoose');
const uri = process.env.MONGO_URI1; // Set in Netlify environment variables

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  apiKey: { type: String, unique: true },
  subscriptionTier: { type: String, default: 'free' },
  queryLimits: {
    model1: { type: Number, default: 100 }, // Free tier limits
    model2: { type: Number, default: 50 },
  },
  queryUsage: {
    model1: { type: Number, default: 0 },
    model2: { type: Number, default: 0 },
  },
});

module.exports = mongoose.model('User', userSchema);