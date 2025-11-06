const admin = require('firebase-admin');
const logger = require('../utils/logger');
const reportService = require('../services/reportService');
const fileHelper = require('../utils/fileHelper');

const db = admin.firestore();

exports.uploadReport = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files allowed' });
    }

    logger.info(`📄 Uploading PDF for user ${userId}: ${file.originalname}`);

    // Upload file to Firebase Storage
    const fileInfo = await fileHelper.uploadFileToFirebase(
      file.buffer,
      file.originalname,
      userId
    );

    // Extract and summarize PDF using Gemini
    logger.info(`🤖 Generating summary with Gemini...`);
    const summary = await reportService.extractAndSummarizePDF(file.buffer);

    // Store report metadata + summary in Firestore
    const reportData = {
      userId,
      fileName: fileInfo.fileName,
      storagePath: fileInfo.storagePath,
      downloadUrl: fileInfo.downloadUrl,
      summary: summary,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const reportRef = await db.collection('reports').add(reportData);

    logger.info(`✅ Report stored with summary in Firestore`);

    res.json({
      status: 'success',
      reportId: reportRef.id,
      fileName: fileInfo.fileName,
      summary: summary,
      downloadUrl: fileInfo.downloadUrl
    });
  } catch (error) {
    logger.error('Upload report error:', error.message);
    next(error);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snapshot = await db
      .collection('reports')
      .where('userId', '==', userId)
      .orderBy('uploadedAt', 'desc')
      .get();

    const reports = [];
    snapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      count: reports.length,
      reports
    });
  } catch (error) {
    logger.error('Get reports error:', error.message);
    next(error);
  }
};

exports.getReport = async (req, res, next) => {
  try {
    const { userId, reportId } = req.params;

    const doc = await db.collection('reports').doc(reportId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ report: data });
  } catch (error) {
    logger.error('Get report error:', error.message);
    next(error);
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const { userId, reportId } = req.params;

    const doc = await db.collection('reports').doc(reportId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete from Firebase Storage
    await fileHelper.deleteFileFromFirebase(data.storagePath);

    // Delete from Firestore
    await db.collection('reports').doc(reportId).delete();

    logger.info(`✅ Report deleted: ${reportId}`);

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    logger.error('Delete report error:', error.message);
    next(error);
  }
};
