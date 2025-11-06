const model = require('../config/gemini');
const logger = require('../utils/logger');

exports.chat = async (message, userContext = '', bpContext = '') => {
  try {
    const prompt = `
You are a healthcare AI assistant.

Patient Medical History: ${userContext}
Recent Vitals: ${bpContext}

Patient: ${message}

Provide helpful, empathetic health advice. Keep response concise.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error('Gemini chat error:', error.message);
    throw error;
  }
};

exports.generateRemedy = async (alertType, systolic, diastolic, heartRate, spo2, userContext) => {
  try {
    const prompt = `
EMERGENCY ALERT: ${alertType}

Patient Vitals:
- Blood Pressure: ${systolic}/${diastolic} mmHg
- Heart Rate: ${heartRate} bpm
- SpO₂: ${spo2}%

Patient Medical History: ${userContext}

Generate IMMEDIATE remedy for this patient. Focus on:
1. Immediate actions (next 5-10 minutes)
2. What to avoid
3. When to seek emergency care

Keep under 150 words. Be clear and actionable.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const remedy = response.text();

    return `${remedy}\n\n⚠️ NOTE: This remedy is NOT YET VERIFIED by a doctor.`;
  } catch (error) {
    logger.error('Gemini remedy error:', error.message);
    throw error;
  }
};

exports.summarizePDF = async (pdfText) => {
  try {
    const prompt = `
Summarize this medical report in 200-300 words:

${pdfText}

Focus on: key findings, abnormalities, doctor's recommendations.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error('Gemini PDF summary error:', error.message);
    throw error;
  }
};
