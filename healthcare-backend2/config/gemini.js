const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  logger.info('✅ Gemini API initialized');
  
  module.exports = model;
} catch (error) {
  logger.error('❌ Gemini initialization error:', error.message);
  module.exports = null;
}
