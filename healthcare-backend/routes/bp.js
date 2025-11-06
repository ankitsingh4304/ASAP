const express = require('express');
const bpController = require('../controllers/bpController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/receive', bpController.receiveBPData);
router.get('/history/:userId', authMiddleware, bpController.getBPHistory);
router.get('/latest/:userId', authMiddleware, bpController.getLatestBP);
router.get('/stats/:userId', authMiddleware, bpController.getBPStats);

module.exports = router;
