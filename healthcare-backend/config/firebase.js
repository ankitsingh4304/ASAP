const admin = require('firebase-admin');
const logger = require('../utils/logger');

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  logger.info('✅ Firebase Admin SDK initialized');
} catch (error) {
  logger.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

module.exports = admin;
