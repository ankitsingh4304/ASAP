const admin = require('firebase-admin');
const geminiService = require('./geminiService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

const db = admin.firestore();

exports.checkAbnormality = async (userId, systolic, diastolic, heartRate, spo2) => {
  try {
    const HIGH_SYSTOLIC = parseInt(process.env.BP_HIGH_SYSTOLIC) || 140;
    const LOW_SYSTOLIC = parseInt(process.env.BP_LOW_SYSTOLIC) || 90;
    const HIGH_DIASTOLIC = parseInt(process.env.BP_HIGH_DIASTOLIC) || 90;
    const LOW_DIASTOLIC = parseInt(process.env.BP_LOW_DIASTOLIC) || 60;

    let alertType = null;
    let severity = null;

    if (systolic >= 180 || diastolic >= 120) {
      alertType = 'CRITICAL_HIGH_BP';
      severity = 'critical';
    } else if (systolic >= HIGH_SYSTOLIC || diastolic >= HIGH_DIASTOLIC) {
      alertType = 'HIGH_BP';
      severity = 'high';
    } else if (systolic <= LOW_SYSTOLIC || diastolic <= LOW_DIASTOLIC) {
      alertType = 'LOW_BP';
      severity = 'medium';
    } else if (spo2 < 95) {
      alertType = 'LOW_SPO2';
      severity = 'medium';
    } else if (heartRate > 100) {
      alertType = 'TACHYCARDIA';
      severity = 'medium';
    } else if (heartRate < 55) {
      alertType = 'BRADYCARDIA';
      severity = 'medium';
    }

    if (!alertType) {
      return null;
    }

    logger.warn(`⚠️ ABNORMALITY DETECTED: ${alertType} for user ${userId}`);

    const userDoc = await db.collection('users').doc(userId).get();
    const userContext = userDoc.data()?.medical_history || 'No medical history available';

    const remedy = await geminiService.generateRemedy(
      alertType,
      systolic,
      diastolic,
      heartRate,
      spo2,
      userContext
    );

    logger.info(`🤖 Gemini remedy generated for ${alertType}`);

    const alertData = {
      userId,
      type: alertType,
      severity,
      systolic,
      diastolic,
      heart_rate: heartRate,
      spo2,
      remedy,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const alertRef = await db.collection('alerts').add(alertData);

    await notificationService.notifyPatient(userId, {
      title: `⚠️ ${alertType.replace(/_/g, ' ')} Detected`,
      body: remedy,
      alertId: alertRef.id
    });

    await notificationService.notifyDoctor(userId, {
      alertType,
      systolic,
      diastolic,
      heartRate,
      spo2,
      remedy,
      patientContext: userContext,
      alertId: alertRef.id
    });

    logger.info(`✅ Alert created and notifications sent for ${alertType}`);

    return {
      alertId: alertRef.id,
      type: alertType,
      severity,
      remedy,
      verified: false
    };
  } catch (error) {
    logger.error('Check abnormality error:', error.message);
    throw error;
  }
};
