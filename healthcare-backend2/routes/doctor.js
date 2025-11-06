const express = require('express');
const doctorController = require('../controllers/doctorController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/patients', authMiddleware, doctorController.getPatients);
router.get('/patient/:userId', authMiddleware, doctorController.getPatientDetails);
router.get('/remedies/pending', authMiddleware, doctorController.getPendingRemedies);
router.post('/remedy/:remedyId/verify', authMiddleware, doctorController.verifyRemedy);

module.exports = router;
