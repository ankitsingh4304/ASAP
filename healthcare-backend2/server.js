const express = require('express');
const cors = require('cors');
require('dotenv').config();
const logger = require('./utils/logger');

// Initialize Firebase
require('./config/firebase');

// Import routes
const authRoutes = require('./routes/auth');
const bpRoutes = require('./routes/bp');
const alertRoutes = require('./routes/alerts');
const chatbotRoutes = require('./routes/chatbot');
const doctorRoutes = require('./routes/doctor');
const reportRoutes = require('./routes/reports');

// ✅ IMPORT BP SCHEDULER (NEW)
const bpScheduler = require('./services/bpProcessingScheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bp', bpRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: '✅ Backend running',
    timestamp: new Date()
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Backend running on port ${PORT}`);
  logger.info(`✅ Firebase initialized`);
  logger.info(`✅ Gemini API ready`);
  logger.info(`🔄 Starting BP processing scheduler (every 1 minute)...`);

  // ✅ START BP PROCESSING SCHEDULER (REPLACES old auto-ingestion)
  bpScheduler.startBPProcessingScheduler();
});
