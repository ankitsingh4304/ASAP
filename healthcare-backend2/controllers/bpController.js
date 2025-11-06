const admin = require('firebase-admin');
const logger = require('../utils/logger');
const alertService = require('../services/alertService');

let bpCalculationService = null;

try {
  bpCalculationService = require('../services/bpCalculationService');
} catch (error) {
  logger.error('Warning: Could not load BP calculation service:', error.message);
}

const db = admin.firestore();

// ✅ Receive ECG + PPG data from ESP32
exports.receiveSensorData = async (req, res, next) => {
  try {
    const { userId, deviceId, ecg_signal, ppg_signal, timestamp } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!Array.isArray(ecg_signal) || !Array.isArray(ppg_signal)) {
      return res.status(400).json({ 
        error: 'ecg_signal and ppg_signal must be arrays' 
      });
    }

    if (ecg_signal.length === 0 || ppg_signal.length === 0) {
      return res.status(400).json({ 
        error: 'ecg_signal and ppg_signal cannot be empty' 
      });
    }

    logger.info(`📡 Sensor data received from ${deviceId || 'unknown'} for user ${userId}`);

    const sensorDataRef = await db.collection('sensor_data_raw').add({
      userId,
      deviceId: deviceId || 'ESP32_DEFAULT',
      ecg_signal: ecg_signal.slice(0, 1000),
      ppg_signal: ppg_signal.slice(0, 1000),
      timestamp: timestamp ? new Date(timestamp) : admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ Raw sensor data stored: ${sensorDataRef.id}`);

    res.json({
      status: 'success',
      sensorDataId: sensorDataRef.id,
      message: 'Sensor data received'
    });
  } catch (error) {
    logger.error('Receive sensor data error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Calculate BP and store (with AGE-BASED constants)
exports.calculateAndStoreBP = async (userId, ecgSignal, ppgSignal, userAge = 40) => {
  try {
    logger.info(`🔢 Calculating BP for user ${userId} (Age: ${userAge})`);

    if (!bpCalculationService) {
      throw new Error('BP calculation service not available');
    }

    // Call BP calculation with age parameter
    const bpResult = await bpCalculationService.calculateBP(
      ecgSignal, 
      ppgSignal, 
      userAge  // ← Pass age for age-based constants
    );

    const bpData = {
      userId,
      ecg_signal: ecgSignal,
      ppg_signal: ppgSignal,
      systolic_bp: bpResult.systolic,
      diastolic_bp: bpResult.diastolic,
      map: bpResult.map,
      heart_rate: bpResult.heart_rate,
      confidence: bpResult.confidence,
      ptt: bpResult.ptt,
      age_used: userAge,
      formula_type: 'age-based-ptt',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('bp_readings').add(bpData);

    logger.info(`✅ BP stored: ${bpResult.systolic}/${bpResult.diastolic} mmHg (Age: ${userAge}, PTT: ${bpResult.ptt.toFixed(2)}ms)`);

    // Check for abnormalities
    const alert = await alertService.checkAbnormality(
      userId,
      bpResult.systolic,
      bpResult.diastolic,
      bpResult.heart_rate,
      null
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

// ✅ Receive manual BP data (for testing without sensors)
exports.receiveBPData = async (req, res, next) => {
  return await exports.receiveBPDataSim(req, res, next);
};

exports.receiveBPDataSim = async (req, res, next) => {
  try {
    const { userId, systolic, diastolic, heart_rate, spo2, timestamp } = req.body;

    if (!userId || !systolic || !diastolic) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logger.info(`📊 BP data received: ${systolic}/${diastolic}`);

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

// ✅ Get BP history for a user
exports.getBPHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const snapshot = await db
      .collection('bp_readings')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit) || 20)
      .get();

    const readings = [];
    snapshot.forEach(doc => {
      readings.push({ id: doc.id, ...doc.data() });
    });

    logger.info(`✅ Retrieved ${readings.length} BP readings for user ${userId}`);

    res.json({ 
      count: readings.length, 
      readings,
      userId 
    });
  } catch (error) {
    logger.error('Get BP history error:', error.message);
    next(error);
  }
};

// ✅ Get latest BP reading
exports.getLatestBP = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const snapshot = await db
      .collection('bp_readings')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      logger.info(`ℹ️ No BP readings found for user ${userId}`);
      return res.json({ reading: null });
    }

    const doc = snapshot.docs[0];
    logger.info(`✅ Latest BP for user ${userId}: ${doc.data().systolic_bp}/${doc.data().diastolic_bp}`);

    res.json({ 
      reading: { id: doc.id, ...doc.data() } 
    });
  } catch (error) {
    logger.error('Get latest BP error:', error.message);
    next(error);
  }
};

// ✅ Get BP statistics for a user
exports.getBPStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const snapshot = await db
      .collection('bp_readings')
      .where('userId', '==', userId)
      .where('timestamp', '>=', cutoffDate)
      .get();

    if (snapshot.empty) {
      logger.info(`ℹ️ No BP data for user ${userId} in last ${days} days`);
      return res.json({ error: 'No BP data', reading_count: 0 });
    }

    let totalSystolic = 0;
    let totalDiastolic = 0;
    let minSystolic = Infinity;
    let maxSystolic = 0;
    let minDiastolic = Infinity;
    let maxDiastolic = 0;
    let totalHR = 0;
    let hrCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      
      const sys = data.systolic_bp || data.systolic || 0;
      const dias = data.diastolic_bp || data.diastolic || 0;
      
      totalSystolic += sys;
      totalDiastolic += dias;
      minSystolic = Math.min(minSystolic, sys);
      maxSystolic = Math.max(maxSystolic, sys);
      minDiastolic = Math.min(minDiastolic, dias);
      maxDiastolic = Math.max(maxDiastolic, dias);

      if (data.heart_rate) {
        totalHR += data.heart_rate;
        hrCount++;
      }
    });

    const count = snapshot.size;
    const avgHR = hrCount > 0 ? Math.round(totalHR / hrCount) : 0;

    const stats = {
      average_systolic: (totalSystolic / count).toFixed(1),
      average_diastolic: (totalDiastolic / count).toFixed(1),
      min_systolic: minSystolic === Infinity ? 0 : minSystolic,
      max_systolic: maxSystolic,
      min_diastolic: minDiastolic === Infinity ? 0 : minDiastolic,
      max_diastolic: maxDiastolic,
      average_heart_rate: avgHR,
      reading_count: count,
      period_days: days,
      userId
    };

    logger.info(`✅ BP stats for user ${userId} (${days} days): Avg ${stats.average_systolic}/${stats.average_diastolic}`);

    res.json(stats);
  } catch (error) {
    logger.error('Get BP stats error:', error.message);
    next(error);
  }
};

module.exports = exports;
