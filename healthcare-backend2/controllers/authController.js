const admin = require('firebase-admin');
const logger = require('../utils/logger');

const db = admin.firestore();
const auth = admin.auth();

exports.signup = async (req, res, next) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: full_name
    });

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      full_name,
      role: role || 'patient',
      medical_history: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ User registered: ${email}`);

    res.json({
      message: 'User registered successfully',
      uid: userRecord.uid,
      email: userRecord.email
    });
  } catch (error) {
    logger.error('Signup error:', error.message);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userRecord = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(userRecord.uid);

    logger.info(`✅ User logged in: ${email}`);

    res.json({
      accessToken: customToken,
      uid: userRecord.uid,
      email: userRecord.email
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: doc.data() });
  } catch (error) {
    logger.error('Get profile error:', error.message);
    next(error);
  }
};
