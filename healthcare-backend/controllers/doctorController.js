const admin = require('firebase-admin');
const logger = require('../utils/logger');

const db = admin.firestore();

exports.getPatients = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection('users')
      .where('role', '==', 'patient')
      .get();

    const patients = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      patients.push({
        id: doc.id,
        full_name: data.full_name,
        email: data.email,
        medical_history: data.medical_history
      });
    });

    res.json({ patients });
  } catch (error) {
    logger.error('Get patients error:', error.message);
    next(error);
  }
};

exports.getPatientDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const bpSnapshot = await db
      .collection('bp_readings')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let latestBP = null;
    if (!bpSnapshot.empty) {
      latestBP = bpSnapshot.docs[0].data();
    }

    const alertsSnapshot = await db
      .collection('alerts')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    const pendingAlerts = [];
    alertsSnapshot.forEach(doc => {
      pendingAlerts.push({ id: doc.id, ...doc.data() });
    });

    // Get reports with summaries
    const reportsSnapshot = await db
      .collection('reports')
      .where('userId', '==', userId)
      .orderBy('uploadedAt', 'desc')
      .get();

    const reports = [];
    reportsSnapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      patient: userDoc.data(),
      latest_bp: latestBP,
      pending_alerts: pendingAlerts,
      reports: reports
    });
  } catch (error) {
    logger.error('Get patient details error:', error.message);
    next(error);
  }
};

exports.getPendingRemedies = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection('alerts')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const remedies = [];
    snapshot.forEach(doc => {
      remedies.push({ id: doc.id, ...doc.data() });
    });

    res.json({ remedies });
  } catch (error) {
    logger.error('Get pending remedies error:', error.message);
    next(error);
  }
};

exports.verifyRemedy = async (req, res, next) => {
  try {
    const { remedyId } = req.params;
    const { doctorNotes, modifications } = req.body;

    await db.collection('alerts').doc(remedyId).update({
      status: 'verified',
      doctorNotes: doctorNotes || '',
      modifications: modifications || '',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ Remedy verified: ${remedyId}`);

    res.json({ message: 'Remedy verified successfully' });
  } catch (error) {
    logger.error('Verify remedy error:', error.message);
    next(error);
  }
};
