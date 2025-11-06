const admin = require('firebase-admin');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = admin.firestore();
const auth = admin.auth();

// ✅ SIGNUP - ADD AGE FIELD
exports.signup = async (req, res, next) => {
  try {
    const { email, password, full_name, age, role } = req.body;

    if (!email || !password || !full_name || !age) {
      return res.status(400).json({ 
        error: 'email, password, full_name, and age are required' 
      });
    }

    logger.info(`📝 Signing up user: ${email}`);

    // Create Firebase Auth user
    const userCredential = await auth.createUser({
      email,
      password,
      displayName: full_name
    });

    const uid = userCredential.uid;

    // Create Firestore user profile with AGE
    await db.collection('users').doc(uid).set({
      uid,
      email,
      full_name,
      age: parseInt(age),  // ← ADD AGE
      role: role || 'patient',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      medical_history: null,
      devices: []
    });

    logger.info(`✅ User created: ${uid}`);

    // Get JWT token
    const token = await auth.createCustomToken(uid);

    res.json({
      status: 'success',
      uid,
      email,
      full_name,
      age,
      token,
      message: 'User created successfully'
    });
  } catch (error) {
    logger.error('Signup error:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    next(error);
  }
};

// ✅ LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    logger.info(`🔐 User logging in: ${email}`);

    // Find user by email
    const userRecord = await auth.getUserByEmail(email);
    
    if (!userRecord) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(400).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data();

    // Create custom token
    const token = await auth.createCustomToken(userRecord.uid);

    logger.info(`✅ User logged in: ${userRecord.uid}`);

    res.json({
      status: 'success',
      uid: userRecord.uid,
      email: userData.email,
      full_name: userData.full_name,
      age: userData.age,  // ← Return age
      role: userData.role,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    next(error);
  }
};

// ✅ GET PROFILE
exports.getProfile = async (req, res, next) => {
  try {
    const uid = req.user.uid;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: userDoc.data()
    });
  } catch (error) {
    logger.error('Get profile error:', error.message);
    next(error);
  }
};

// ✅ UPDATE PROFILE (including age)
exports.updateProfile = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { full_name, age, medical_history } = req.body;

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (age) updateData.age = parseInt(age);  // ← Allow age update
    if (medical_history) updateData.medical_history = medical_history;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await db.collection('users').doc(uid).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ Profile updated for user ${uid}`);

    const userDoc = await db.collection('users').doc(uid).get();

    res.json({
      status: 'success',
      user: userDoc.data()
    });
  } catch (error) {
    logger.error('Update profile error:', error.message);
    next(error);
  }
};

module.exports = exports;
