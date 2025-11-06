const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const admin = require('firebase-admin');

exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    logger.info(`✅ Token verified for user ${decodedToken.uid}`);
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = exports;
