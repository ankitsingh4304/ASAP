const admin = require('firebase-admin');
const logger = require('../utils/logger');
const bpController = require('../controllers/bpController');

const db = admin.firestore();

// ✅ Start the scheduler
exports.startBPProcessingScheduler = () => {
  logger.info('🔄 BP Processing Scheduler started (runs every 1 minute)');

  // Run immediately on startup
  processUnprocessedSensorData();

  // Then run every 60 seconds
  setInterval(() => {
    processUnprocessedSensorData();
  }, 60 * 1000); // 60 seconds
};

// ✅ Process unprocessed sensor data
async function processUnprocessedSensorData() {
  try {
    logger.info('📊 [BP SCHEDULER] Checking for unprocessed sensor data...');

    // Get all unprocessed sensor data from last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const snapshot = await db
      .collection('sensor_data_raw')
      .where('processed', '==', false)
      .where('createdAt', '>=', fiveMinutesAgo)
      .orderBy('createdAt', 'asc')
      .get();

    if (snapshot.empty) {
      logger.info('📊 [BP SCHEDULER] No unprocessed sensor data found');
      return;
    }

    logger.info(`📊 [BP SCHEDULER] Found ${snapshot.size} unprocessed sensor records`);

    // Group by userId
    const userDataMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!userDataMap[data.userId]) {
        userDataMap[data.userId] = {
          records: [],
          allECG: [],
          allPPG: []
        };
      }
      userDataMap[data.userId].records.push({ docId: doc.id, data });
      userDataMap[data.userId].allECG.push(...(data.ecg_signal || []));
      userDataMap[data.userId].allPPG.push(...(data.ppg_signal || []));
    });

    // Process each user's data
    for (const userId in userDataMap) {
      try {
        const userData = userDataMap[userId];

        if (userData.allECG.length === 0 || userData.allPPG.length === 0) {
          logger.warn(`⚠️ [BP SCHEDULER] Insufficient data for user ${userId}`);
          continue;
        }

        logger.info(`🔢 [BP SCHEDULER] Calculating BP for user ${userId} (${userData.allECG.length} ECG samples, ${userData.allPPG.length} PPG samples)`);

        // Calculate BP
        const result = await bpController.calculateAndStoreBP(
          userId,
          userData.allECG,
          userData.allPPG
        );

        logger.info(`✅ [BP SCHEDULER] BP calculated for ${userId}: ${result.bpData.systolic_bp}/${result.bpData.diastolic_bp} mmHg, Status: ${result.status}`);

        // Mark all records as processed
        for (const record of userData.records) {
          await db.collection('sensor_data_raw').doc(record.docId).update({
            processed: true,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        logger.info(`📝 [BP SCHEDULER] Marked ${userData.records.length} records as processed for user ${userId}`);

      } catch (userError) {
        logger.error(`❌ [BP SCHEDULER] Error processing user ${userId}:`, userError.message);
      }
    }

    logger.info('✅ [BP SCHEDULER] Processing cycle complete');

  } catch (error) {
    logger.error('❌ [BP SCHEDULER] Scheduler error:', error.message);
  }
}

module.exports = exports;
