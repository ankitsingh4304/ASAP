const express = require('express');
const bpController = require('../controllers/bpController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Existing endpoints (keep these)
router.post('/receive', bpController.receiveBPData);
router.get('/history/:userId', authMiddleware, bpController.getBPHistory);
router.get('/latest/:userId', authMiddleware, bpController.getLatestBP);
router.get('/stats/:userId', authMiddleware, bpController.getBPStats);

// ✅ NEW ENDPOINT - ESP32 sends ECG + PPG data here
router.post('/sensors/data', bpController.receiveSensorData);

module.exports = router;
