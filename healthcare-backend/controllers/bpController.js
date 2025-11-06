const admin = require('firebase-admin');
const logger = require('../utils/logger');
const alertService = require('../services/alertService');

const db = admin.firestore();

exports.receiveBPData = async (req, res, next) => {
  return await exports.receiveBPDataSim(req, res, next);
};

exports.receiveBPDataSim = async (req, res, next) => {
  try {
    const { userId, systolic, diastolic, heart_rate, spo2, timestamp } = req.body;

    if (!userId || !systolic || !diastolic) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logger.info(`📊 BP data received: ${systolic}/${diastolic} for user ${userId}`);

    const readingData = {
      userId,
      systolic,
      diastolic,
      heart_rate: heart_rate || null,
      spo2: spo2 || null,
      timestamp: timestamp || admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('bp_readings').add(readingData);

    const alert = await alertService.checkAbnormality(
      userId,
      systolic,
      diastolic,
      heart_rate,
      spo2
    );

    if (alert) {
      logger.warn(`⚠️ ALERT TRIGGERED: ${alert.type}`);
    }

    res.json({
      status: 'success',
      reading_id: docRef.id,
      systolic,
      diastolic,
      heart_rate,
      spo2,
      alert: alert || null
    });
  } catch (error) {
    logger.error('Receive BP error:', error.message);
    next(error);
  }
};

exports.getBPHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const snapshot = await db
      .collection('bp_readings')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const readings = [];
    snapshot.forEach(doc => {
      readings.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      count: readings.length,
      readings
    });
  } catch (error) {
    logger.error('Get BP history error:', error.message);
    next(error);
  }
};

exports.getLatestBP = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snapshot = await db
      .collection('bp_readings')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ reading: null });
    }

    const doc = snapshot.docs[0];
    res.json({ reading: { id: doc.id, ...doc.data() } });
  } catch (error) {
    logger.error('Get latest BP error:', error.message);
    next(error);
  }
};

exports.getBPStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const snapshot = await db
      .collection('bp_readings')
      .where('userId', '==', userId)
      .where('timestamp', '>=', cutoffDate)
      .get();

    if (snapshot.empty) {
      return res.json({ error: 'No BP data' });
    }

    let totalSystolic = 0, totalDiastolic = 0;
    let minSystolic = Infinity, maxSystolic = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalSystolic += data.systolic;
      totalDiastolic += data.diastolic;
      minSystolic = Math.min(minSystolic, data.systolic);
      maxSystolic = Math.max(maxSystolic, data.systolic);
    });

    const count = snapshot.size;

    res.json({
      average_systolic: (totalSystolic / count).toFixed(1),
      average_diastolic: (totalDiastolic / count).toFixed(1),
      min_systolic: minSystolic,
      max_systolic: maxSystolic,
      reading_count: count,
      period_days: days
    });
  } catch (error) {
    logger.error('Get BP stats error:', error.message);
    next(error);
  }
};
