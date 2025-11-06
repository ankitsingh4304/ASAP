const pdfParse = require('pdf-parse');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');

exports.extractAndSummarizePDF = async (pdfBuffer) => {
  try {
    // Extract text from PDF
    logger.info('📄 Extracting text from PDF...');
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    logger.info(`📄 PDF extracted: ${pdfData.numpages} pages, ${extractedText.length} characters`);

    // Summarize using Gemini
    logger.info(`🤖 Calling Gemini to summarize PDF...`);
    const summary = await geminiService.summarizePDF(extractedText.substring(0, 5000));

    logger.info(`✅ PDF summary generated`);

    return summary;
  } catch (error) {
    logger.error('Extract and summarize PDF error:', error.message);
    throw error;
  }
};
