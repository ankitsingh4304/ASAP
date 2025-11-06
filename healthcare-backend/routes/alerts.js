const express = require('express');
const alertController = require('../controllers/alertController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', authMiddleware, alertController.getUserAlerts);
router.get('/pending/all', authMiddleware, alertController.getPendingAlerts);
router.post('/:alertId/verify', authMiddleware, alertController.verifyAlert);

module.exports = router;
