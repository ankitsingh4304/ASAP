const express = require('express');
const multer = require('multer');
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) }
});

router.post('/upload', authMiddleware, upload.single('pdf'), reportController.uploadReport);
router.get('/:userId', authMiddleware, reportController.getReports);
router.get('/download/:userId/:reportId', authMiddleware, reportController.getReport);
router.delete('/:userId/:reportId', authMiddleware, reportController.deleteReport);

module.exports = router;
