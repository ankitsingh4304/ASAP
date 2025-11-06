const admin = require('firebase-admin');
const logger = require('./logger');

const bucket = admin.storage().bucket();

exports.uploadFileToFirebase = async (fileBuffer, fileName, userId) => {
  try {
    const timestamp = Date.now();
    const storagePath = `reports/${userId}/${timestamp}-${fileName}`;
    const file = bucket.file(storagePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType: 'application/pdf'
      }
    });

    logger.info(`✅ File uploaded to Firebase Storage: ${storagePath}`);

    // Get signed download URL (7 days)
    const [downloadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    return {
      fileName,
      storagePath,
      downloadUrl,
      uploadedAt: new Date()
    };
  } catch (error) {
    logger.error('Upload file error:', error.message);
    throw error;
  }
};

exports.deleteFileFromFirebase = async (storagePath) => {
  try {
    await bucket.file(storagePath).delete();
    logger.info(`✅ File deleted from Firebase Storage: ${storagePath}`);
  } catch (error) {
    logger.error('Delete file error:', error.message);
    throw error;
  }
};
