const express = require('express');
const chatbotController = require('../controllers/chatbotController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/message', authMiddleware, chatbotController.sendMessage);
router.get('/history/:userId', authMiddleware, chatbotController.getChatHistory);

module.exports = router;
