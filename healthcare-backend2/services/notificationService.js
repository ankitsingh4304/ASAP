const admin = require('firebase-admin');
const logger = require('../utils/logger');

const db = admin.firestore();

exports.notifyPatient = async (userId, notification) => {
  try {
    await db.collection('notifications').add({
      userId,
      type: 'patient_alert',
      title: notification.title,
      body: notification.body,
      alertId: notification.alertId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ Patient notified: ${userId}`);
  } catch (error) {
    logger.error('Notify patient error:', error.message);
  }
};

exports.notifyDoctor = async (patientId, alertData) => {
  try {
    const doctorsSnapshot = await db
      .collection('users')
      .where('role', '==', 'doctor')
      .get();

    if (doctorsSnapshot.empty) {
      logger.warn('No doctors found to notify');
      return;
    }

    for (const doctorDoc of doctorsSnapshot.docs) {
      await db.collection('notifications').add({
        userId: doctorDoc.id,
        type: 'doctor_alert',
        patientId: patientId,
        alertType: alertData.alertType,
        systolic: alertData.systolic,
        diastolic: alertData.diastolic,
        heartRate: alertData.heartRate,
        spo2: alertData.spo2,
        remedy: alertData.remedy,
        patientContext: alertData.patientContext,
        alertId: alertData.alertId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`✅ Doctor notified: ${doctorDoc.id}`);
    }
  } catch (error) {
    logger.error('Notify doctor error:', error.message);
  }
};
