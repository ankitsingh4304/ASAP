const logger = require('../utils/logger');

// ✅ Main BP calculation function
exports.calculateBP = async (ecgSignal, ppgSignal) => {
  try {
    logger.info('📊 Starting BP calculation from ECG + PPG signals');

    // STEP 1: Extract ECG features
    const ecgFeatures = extractECGFeatures(ecgSignal);
    logger.debug('✅ ECG features extracted:', {
      heartRate: ecgFeatures.heartRate,
      rrIntervals: ecgFeatures.rrIntervals.length
    });

    // STEP 2: Extract PPG features
    const ppgFeatures = extractPPGFeatures(ppgSignal);
    logger.debug('✅ PPG features extracted:', {
      pulseArrivalTime: ppgFeatures.pulseArrivalTime,
      pulseWidth: ppgFeatures.pulseWidths.length
    });

    // STEP 3: Apply your calibrated BP formula
    const bpResult = applyBPFormula(ecgFeatures, ppgFeatures);

    logger.info(`✅ BP Calculated: ${bpResult.systolic}/${bpResult.diastolic} mmHg, HR: ${bpResult.heart_rate} bpm`);

    return {
      systolic: bpResult.systolic,
      diastolic: bpResult.diastolic,
      map: bpResult.map,
      heart_rate: bpResult.heart_rate,
      confidence: bpResult.confidence
    };
  } catch (error) {
    logger.error('BP calculation error:', error.message);
    throw error;
  }
};

// ✅ Extract ECG Features
function extractECGFeatures(ecgSignal) {
  try {
    const rPeaks = findRPeaks(ecgSignal);
    const rrIntervals = calculateRRIntervals(rPeaks);

    // Calculate heart rate (60000 ms per minute / average R-R interval in ms)
    const avgRRInterval = rrIntervals.length > 0 ?
      rrIntervals.reduce((a, b) => a + b) / rrIntervals.length :
      800; // Default fallback

    const heartRate = Math.round(60000 / avgRRInterval);

    return {
      rPeaks,
      rrIntervals,
      heartRate: Math.max(40, Math.min(200, heartRate)), // Clamp between 40-200 bpm
      qrsWidth: calculateQRSWidth(ecgSignal, rPeaks),
      stSegment: calculateSTSegment(ecgSignal, rPeaks)
    };
  } catch (error) {
    logger.error('ECG feature extraction error:', error.message);
    return {
      rPeaks: [],
      rrIntervals: [800],
      heartRate: 70,
      qrsWidth: 100,
      stSegment: 0
    };
  }
}

// ✅ Extract PPG Features
function extractPPGFeatures(ppgSignal) {
  try {
    const pulses = findPulses(ppgSignal);
    const pulseWidths = calculatePulseWidths(pulses);
    const pulseAmplitudes = calculatePulseAmplitudes(pulses);

    return {
      pulses,
      pulseWidths,
      pulseAmplitudes,
      pulseArrivalTime: calculatePulseArrivalTime(ppgSignal),
      dicroticNotch: detectDicroticNotch(ppgSignal),
      avgPulseWidth: pulseWidths.length > 0 ?
        pulseWidths.reduce((a, b) => a + b) / pulseWidths.length :
        50
    };
  } catch (error) {
    logger.error('PPG feature extraction error:', error.message);
    return {
      pulses: [],
      pulseWidths: [50],
      pulseAmplitudes: [1],
      pulseArrivalTime: 100,
      dicroticNotch: false,
      avgPulseWidth: 50
    };
  }
}

// ✅ Apply BP Formula
function applyBPFormula(ecgFeatures, ppgFeatures) {
  // ⚠️ REPLACE THIS WITH YOUR ACTUAL BP CALCULATION FORMULA
  // This is a working example - modify coefficients based on your research

  try {
    // Calibration constants (YOU NEED TO REPLACE WITH YOUR CALIBRATED VALUES)
    // Based on your training/validation data
    const calibration = {
      systolic: {
        baseOffset: 60,           // Base systolic offset
        rrFactor: -0.08,          // Coefficient for R-R interval
        patFactor: 0.25,          // Coefficient for pulse arrival time
        pwFactor: 0.15,           // Coefficient for pulse width
        hrFactor: 0.05            // Coefficient for heart rate
      },
      diastolic: {
        baseOffset: 40,           // Base diastolic offset
        rrFactor: -0.05,          // Coefficient for R-R interval
        patFactor: 0.15,          // Coefficient for pulse arrival time
        pwFactor: 0.08,           // Coefficient for pulse width
        hrFactor: 0.02            // Coefficient for heart rate
      }
    };

    const hrValue = ecgFeatures.heartRate;
    const rrValue = ecgFeatures.rrIntervals[0] || 800;
    const patValue = ppgFeatures.pulseArrivalTime;
    const pwValue = ppgFeatures.avgPulseWidth;

    // Calculate Systolic BP
    const systolic = Math.round(
      calibration.systolic.baseOffset +
      (calibration.systolic.rrFactor * rrValue) +
      (calibration.systolic.patFactor * patValue) +
      (calibration.systolic.pwFactor * pwValue) +
      (calibration.systolic.hrFactor * hrValue)
    );

    // Calculate Diastolic BP
    const diastolic = Math.round(
      calibration.diastolic.baseOffset +
      (calibration.diastolic.rrFactor * rrValue) +
      (calibration.diastolic.patFactor * patValue) +
      (calibration.diastolic.pwFactor * pwValue) +
      (calibration.diastolic.hrFactor * hrValue)
    );

    // Calculate Mean Arterial Pressure
    const map = Math.round((systolic + 2 * diastolic) / 3);

    // Calculate confidence (based on signal quality - simple example)
    const signalQuality = Math.min(1, Math.max(0, 0.85)); // Replace with actual quality metric
    const confidence = Math.round(signalQuality * 100) / 100;

    // Ensure values are within reasonable physiological range
    const constrainedSystolic = Math.max(50, Math.min(250, systolic));
    const constrainedDiastolic = Math.max(30, Math.min(150, diastolic));

    return {
      systolic: constrainedSystolic,
      diastolic: constrainedDiastolic,
      map: Math.round((constrainedSystolic + 2 * constrainedDiastolic) / 3),
      heart_rate: hrValue,
      confidence: confidence,
      debug: {
        rrInterval: rrValue,
        pulseArrivalTime: patValue,
        pulseWidth: pwValue
      }
    };
  } catch (error) {
    logger.error('BP formula application error:', error.message);
    return {
      systolic: 120,
      diastolic: 80,
      map: 93,
      heart_rate: 70,
      confidence: 0.5
    };
  }
}

// ✅ HELPER FUNCTIONS

function findRPeaks(ecgSignal) {
  // Simple R-peak detection using threshold
  if (!ecgSignal || ecgSignal.length < 10) return [];

  const rPeaks = [];
  const threshold = Math.max(...ecgSignal) * 0.5;

  for (let i = 1; i < ecgSignal.length - 1; i++) {
    if (ecgSignal[i] > threshold &&
        ecgSignal[i] > ecgSignal[i - 1] &&
        ecgSignal[i] > ecgSignal[i + 1]) {
      rPeaks.push(i);
    }
  }

  return rPeaks;
}

function calculateRRIntervals(rPeaks) {
  // Calculate intervals between R-peaks (in samples, convert to ms)
  if (rPeaks.length < 2) return [800]; // Default interval

  const intervals = [];
  for (let i = 1; i < rPeaks.length; i++) {
    const interval = (rPeaks[i] - rPeaks[i - 1]) * 4; // Assuming 250 Hz sampling = 4ms per sample
    if (interval > 300 && interval < 2000) { // Physiologically valid range
      intervals.push(interval);
    }
  }

  return intervals.length > 0 ? intervals : [800];
}

function calculateQRSWidth(ecgSignal, rPeaks) {
  // Estimate QRS width (typical: 80-120 ms)
  if (rPeaks.length === 0) return 100;

  let totalWidth = 0;
  for (let i = 0; i < Math.min(3, rPeaks.length); i++) {
    const peak = rPeaks[i];
    let width = 0;

    for (let j = peak; j < ecgSignal.length && ecgSignal[j] > 0; j++) width++;
    for (let j = peak; j >= 0 && ecgSignal[j] > 0; j--) width++;

    totalWidth += width;
  }

  return Math.round(totalWidth / Math.min(3, rPeaks.length) * 4); // Convert to ms
}

function calculateSTSegment(ecgSignal, rPeaks) {
  // Simple ST segment detection
  if (rPeaks.length === 0) return 0;

  const peakIndex = rPeaks[0];
  const stIndex = Math.min(peakIndex + 50, ecgSignal.length - 1);

  return ecgSignal[stIndex] || 0;
}

function findPulses(ppgSignal) {
  // Find pulse peaks in PPG signal
  if (!ppgSignal || ppgSignal.length < 10) return [];

  const pulses = [];
  const threshold = (Math.max(...ppgSignal) + Math.min(...ppgSignal)) / 2;

  for (let i = 1; i < ppgSignal.length - 1; i++) {
    if (ppgSignal[i] > threshold &&
        ppgSignal[i] > ppgSignal[i - 1] &&
        ppgSignal[i] > ppgSignal[i + 1]) {
      pulses.push(i);
    }
  }

  return pulses;
}

function calculatePulseWidths(pulses) {
  // Calculate pulse widths
  return pulses.map(() => 50); // Default pulse width in samples
}

function calculatePulseAmplitudes(pulses) {
  // Calculate pulse amplitudes
  return pulses.map(() => 1.0); // Default amplitude
}

function calculatePulseArrivalTime(ppgSignal) {
  // Time from ECG to PPG (pulse transit time)
  // Typical: 50-150 ms, use 100 as default
  if (!ppgSignal || ppgSignal.length === 0) return 100;

  return 100; // milliseconds (typical value)
}

function detectDicroticNotch(ppgSignal) {
  // Detect dicrotic notch in PPG signal (indicates secondary peak)
  if (!ppgSignal || ppgSignal.length < 20) return false;

  // Simple detection: look for secondary peak
  const peaks = findPulses(ppgSignal);
  return peaks.length > 5; // More peaks = presence of dicrotic notch
}

module.exports = exports;
