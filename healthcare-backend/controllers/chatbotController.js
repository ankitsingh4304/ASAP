const admin = require('firebase-admin');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

const db = admin.firestore();

exports.sendMessage = async (req, res, next) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logger.info(`💬 Chat message from ${userId}: ${message}`);

    const userDoc = await db.collection('users').doc(userId).get();
    const userContext = userDoc.data()?.medical_history || '';

    const bpSnapshot = await db
      .collection('bp_readings')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let bpContext = 'No recent BP data';
    if (!bpSnapshot.empty) {
      const latestBP = bpSnapshot.docs[0].data();
      bpContext = `Latest BP: ${latestBP.systolic}/${latestBP.diastolic} mmHg, HR: ${latestBP.heart_rate} bpm, SpO2: ${latestBP.spo2}%`;
    }

    const geminiResponse = await geminiService.chat(message, userContext, bpContext);

    await db.collection('conversations').add({
      userId,
      sender: 'patient',
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('conversations').add({
      userId,
      sender: 'bot',
      message: geminiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ Chatbot response sent`);

    res.json({
      status: 'success',
      response: geminiResponse
    });
  } catch (error) {
    logger.error('Chatbot error:', error.message);
    next(error);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snapshot = await db
      .collection('conversations')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push(doc.data());
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    logger.error('Get chat history error:', error.message);
    next(error);
  }
};
