const express = require('express');
const cors = require('cors');
const fs = require('fs');
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
  logger.info(`🔄 Starting BP auto-ingestion from JSON...`);

  // Start auto-ingestion
  startBPAutoIngestion();
});

// ========================================
// AUTO-INGEST BP DATA FROM JSON FILE
// ========================================
function startBPAutoIngestion() {
  const bpController = require('./controllers/bpController');

  try {
    const data = JSON.parse(fs.readFileSync('./data/mock_bp_data.json', 'utf-8'));
    let recordIndex = 0;

    logger.info(`📄 Loaded ${data.records.length} BP records from JSON`);

    async function postNextRecord() {
      if (recordIndex >= data.records.length) {
        logger.info('✅ All JSON data ingested. Loop will restart.');
        recordIndex = 0;
      }

      const record = data.records[recordIndex];
      logger.info(`📊 Processing record ${recordIndex + 1}/${data.records.length}`);

      const mockReq = {
        body: {
          userId: data.userId,
          ...record
        }
      };

      const mockRes = {
        json: (result) => {
          logger.info(`✅ BP Data stored: ${result.systolic}/${result.diastolic}`);
          if (result.alert) {
            logger.warn(`⚠️ ALERT TRIGGERED: ${result.alert.type}`);
          }
        },
        status: () => mockRes
      };

      await bpController.receiveBPDataSim(mockReq, mockRes, (err) => {
        if (err) logger.error('Error ingesting BP:', err.message);
      });

      recordIndex++;
      setTimeout(postNextRecord, 60 * 1000); // 1 minute
    }

    postNextRecord();

  } catch (error) {
    logger.error('Failed to start BP auto-ingestion:', error.message);
  }
}
