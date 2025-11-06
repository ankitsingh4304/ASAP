const admin = require('firebase-admin');
const logger = require('../utils/logger');
const alertService = require('../services/alertService');
const bpCalculationService = require('../services/bpCalculationService');

const db = admin.firestore();

// ✅ NEW FUNCTION: Receive ECG + PPG data from ESP32
exports.receiveSensorData = async (req, res, next) => {
  try {
    const { userId, deviceId, ecg_signal, ppg_signal, timestamp } = req.body;

    if (!userId || !ecg_signal || !ppg_signal) {
      return res.status(400).json({
        error: 'Missing required fields: userId, ecg_signal, ppg_signal'
      });
    }

    if (!Array.isArray(ecg_signal) || !Array.isArray(ppg_signal)) {
      return res.status(400).json({
        error: 'ecg_signal and ppg_signal must be arrays'
      });
    }

    logger.info(`📡 Sensor data received from device ${deviceId} for user ${userId}`);
    logger.info(`   ECG samples: ${ecg_signal.length}, PPG samples: ${ppg_signal.length}`);

    // Store raw sensor data
    const sensorDataRef = await db.collection('sensor_data_raw').add({
      userId,
      deviceId: deviceId || 'ESP32_DEFAULT',
      ecg_signal,
      ppg_signal,
      timestamp: timestamp ? new Date(timestamp) : admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ Raw sensor data stored with ID: ${sensorDataRef.id}`);

    res.json({
      status: 'success',
      sensorDataId: sensorDataRef.id,
      message: 'Sensor data received. Will be processed for BP calculation.',
      ecgSamples: ecg_signal.length,
      ppgSamples: ppg_signal.length
    });
  } catch (error) {
    logger.error('Receive sensor data error:', error.message);
    next(error);
  }
};

// ✅ NEW FUNCTION: Calculate BP from signals (called by scheduler every 1 minute)
exports.calculateAndStoreBP = async (userId, ecgSignal, ppgSignal) => {
  try {
    logger.info(`🔢 Calculating BP for user ${userId} (ECG: ${ecgSignal.length} samples, PPG: ${ppgSignal.length} samples)`);

    // Call your BP calculation service
    const bpResult = await bpCalculationService.calculateBP(ecgSignal, ppgSignal);

    logger.info(`📊 BP Calculation Result: Systolic=${bpResult.systolic}, Diastolic=${bpResult.diastolic}, HR=${bpResult.heart_rate}`);

    // Store in Firestore
    const bpData = {
      userId,
      ecg_signal: ecgSignal,
      ppg_signal: ppgSignal,
      systolic_bp: bpResult.systolic,
      diastolic_bp: bpResult.diastolic,
      map: bpResult.map,
      heart_rate: bpResult.heart_rate,
      confidence: bpResult.confidence,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('bp_readings').add(bpData);

    logger.info(`✅ BP stored in Firestore: ${bpResult.systolic}/${bpResult.diastolic} mmHg, HR: ${bpResult.heart_rate} bpm`);

    // Check for abnormalities
    const alert = await alertService.checkAbnormality(
      userId,
      bpResult.systolic,
      bpResult.diastolic,
      bpResult.heart_rate,
      null // SpO2 not available from ECG+PPG only
    );

    if (alert) {
      logger.warn(`⚠️ ALERT TRIGGERED: ${alert.type}`);
      return { bpData, alert, status: 'abnormality_detected' };
    }

    return { bpData, alert: null, status: 'normal' };
  } catch (error) {
    logger.error('Calculate BP error:', error.message);
    throw error;
  }
};

// EXISTING FUNCTIONS (keep all these)
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
      totalSystolic += data.systolic_bp || data.systolic || 0;
      totalDiastolic += data.diastolic_bp || data.diastolic || 0;
      minSystolic = Math.min(minSystolic, data.systolic_bp || data.systolic || 0);
      maxSystolic = Math.max(maxSystolic, data.systolic_bp || data.systolic || 0);
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
