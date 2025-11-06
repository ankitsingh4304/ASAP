const admin = require('firebase-admin');
const logger = require('../utils/logger');

const db = admin.firestore();

exports.getUserAlerts = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snapshot = await db
      .collection('alerts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const alerts = [];
    snapshot.forEach(doc => {
      alerts.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      count: alerts.length,
      alerts
    });
  } catch (error) {
    logger.error('Get user alerts error:', error.message);
    next(error);
  }
};

exports.getPendingAlerts = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection('alerts')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const alerts = [];
    snapshot.forEach(doc => {
      alerts.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      count: alerts.length,
      alerts
    });
  } catch (error) {
    logger.error('Get pending alerts error:', error.message);
    next(error);
  }
};

exports.verifyAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { doctorNotes, modifications } = req.body;

    await db.collection('alerts').doc(alertId).update({
      status: 'verified',
      doctorNotes: doctorNotes || '',
      modifications: modifications || '',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ Alert verified: ${alertId}`);

    res.json({ message: 'Alert verified successfully' });
  } catch (error) {
    logger.error('Verify alert error:', error.message);
    next(error);
  }
};
