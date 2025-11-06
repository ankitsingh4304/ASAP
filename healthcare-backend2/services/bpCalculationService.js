const logger = require('../utils/logger');

// ✅ AGE-BASED PTT BP CALCULATION
exports.calculateBP = async (ecgSignal, ppgSignal, userAge) => {
  try {
    if (!ecgSignal || !ppgSignal || ecgSignal.length === 0 || ppgSignal.length === 0) {
      throw new Error('Invalid signal arrays');
    }

    logger.info(`📊 Starting BP calculation using Age-Based PTT formula (Age: ${userAge})`);

    // STEP 1: Calculate PTT
    const ptt = calculatePTT(ecgSignal, ppgSignal);
    logger.info(`✅ PTT calculated: ${ptt.toFixed(2)} ms`);

    // STEP 2: Extract HR
    const heartRate = extractHeartRate(ecgSignal);
    logger.info(`✅ Heart Rate: ${heartRate} bpm`);

    // STEP 3: Get age-based constants
    const constants = getAgeBasedConstants(userAge);
    logger.info(`✅ Using age-based constants: a=${constants.a}, b=${constants.b}, c=${constants.c}, d=${constants.d}`);

    // STEP 4: Calculate BP using formula
    const bpResult = calculateBPFromPTT(ptt, heartRate, constants);

    logger.info(`✅ BP: ${bpResult.systolic}/${bpResult.diastolic} mmHg`);

    return bpResult;
  } catch (error) {
    logger.error('BP calculation error:', error.message);
    return {
      systolic: 120,
      diastolic: 80,
      map: 93,
      heart_rate: 70,
      confidence: 0.5,
      age_based: false
    };
  }
};

// ✅ GET AGE-BASED CALIBRATION CONSTANTS
function getAgeBasedConstants(age) {
  // Ensure age is a number
  const userAge = parseInt(age) || 40;

  let constants;

  if (userAge < 20) {
    // Very young - use 20-30 constants
    constants = { a: -18, b: 130, c: -10, d: 85, ageGroup: '<20' };
  } else if (userAge < 30) {
    constants = { a: -18, b: 130, c: -10, d: 85, ageGroup: '20-30' };
  } else if (userAge < 40) {
    constants = { a: -19, b: 140, c: -11, d: 90, ageGroup: '30-40' };
  } else if (userAge < 50) {
    constants = { a: -20, b: 155, c: -12, d: 100, ageGroup: '40-50' };
  } else if (userAge < 60) {
    constants = { a: -21, b: 165, c: -13, d: 105, ageGroup: '50-60' };
  } else if (userAge < 70) {
    constants = { a: -22, b: 175, c: -14, d: 110, ageGroup: '60-70' };
  } else {
    // 70+
    constants = { a: -23, b: 185, c: -15, d: 115, ageGroup: '70+' };
  }

  logger.info(`📊 Age-based constants selected for age ${userAge} (Group: ${constants.ageGroup})`);
  return constants;
}

// ✅ CALCULATE PTT
function calculatePTT(ecgSignal, ppgSignal) {
  try {
    const rPeakIndex = findRPeakIndex(ecgSignal);
    const ppgPulseOnsetIndex = findPPGPulseOnset(ppgSignal, rPeakIndex);

    const SAMPLE_DURATION_MS = 4; // 250 Hz sampling rate
    const ptt = (ppgPulseOnsetIndex - rPeakIndex) * SAMPLE_DURATION_MS;

    logger.debug(`R-peak: ${rPeakIndex}, PPG onset: ${ppgPulseOnsetIndex}, PTT: ${ptt} ms`);

    // Clamp to physiological range
    if (ptt < 50) return 50;
    if (ptt > 200) return 200;

    return ptt;
  } catch (error) {
    logger.error('PTT calculation error:', error.message);
    return 100;
  }
}

// ✅ FIND R-PEAK INDEX
function findRPeakIndex(ecgSignal) {
  try {
    if (!ecgSignal || ecgSignal.length === 0) return 0;

    let maxIndex = 0;
    let maxValue = ecgSignal[0];

    for (let i = 1; i < ecgSignal.length; i++) {
      if (ecgSignal[i] > maxValue) {
        maxValue = ecgSignal[i];
        maxIndex = i;
      }
    }

    return maxIndex;
  } catch (error) {
    logger.warn('Error finding R-peak:', error.message);
    return Math.floor(ecgSignal.length / 2);
  }
}

// ✅ FIND PPG PULSE ONSET
function findPPGPulseOnset(ppgSignal, rPeakIndex) {
  try {
    if (!ppgSignal || ppgSignal.length === 0) return rPeakIndex + 25;

    const searchStart = Math.max(0, rPeakIndex);
    const searchEnd = Math.min(ppgSignal.length - 1, rPeakIndex + 100);

    let maxSlope = 0;
    let maxSlopeIndex = searchStart;

    for (let i = searchStart + 1; i < searchEnd; i++) {
      const slope = ppgSignal[i] - ppgSignal[i - 1];
      if (slope > maxSlope) {
        maxSlope = slope;
        maxSlopeIndex = i;
      }
    }

    return maxSlopeIndex;
  } catch (error) {
    logger.warn('Error finding PPG pulse onset:', error.message);
    return rPeakIndex + 25;
  }
}

// ✅ EXTRACT HEART RATE FROM ECG
function extractHeartRate(ecgSignal) {
  try {
    if (!ecgSignal || ecgSignal.length < 20) return 70;

    const rPeaks = [];
    const threshold = Math.max(...ecgSignal) * 0.5;

    for (let i = 1; i < ecgSignal.length - 1; i++) {
      if (ecgSignal[i] > threshold &&
          ecgSignal[i] > ecgSignal[i - 1] &&
          ecgSignal[i] > ecgSignal[i + 1]) {
        rPeaks.push(i);
      }
    }

    if (rPeaks.length < 2) return 70;

    let sumRRInterval = 0;
    for (let i = 1; i < rPeaks.length; i++) {
      sumRRInterval += (rPeaks[i] - rPeaks[i - 1]);
    }

    const avgRRInterval = sumRRInterval / (rPeaks.length - 1);
    const SAMPLE_DURATION_MS = 4;
    const heartRate = Math.round(60000 / (avgRRInterval * SAMPLE_DURATION_MS));

    return Math.max(40, Math.min(200, heartRate));
  } catch (error) {
    logger.warn('Error extracting heart rate:', error.message);
    return 70;
  }
}

// ✅ CALCULATE BP USING PTT FORMULA (AGE-BASED)
function calculateBPFromPTT(ptt, heartRate, constants) {
  try {
    const { a, b, c, d } = constants;

    const lnPTT = Math.log(ptt);

    // Formula: Systolic = a × ln(PTT) + b
    let systolic = Math.round(a * lnPTT + b);

    // Formula: Diastolic = c × ln(PTT) + d
    let diastolic = Math.round(c * lnPTT + d);

    // Ensure physiological constraints
    systolic = Math.max(50, Math.min(250, systolic));
    diastolic = Math.max(30, Math.min(150, diastolic));

    // Ensure systolic > diastolic
    if (systolic <= diastolic) {
      systolic = diastolic + 20;
    }

    // Calculate Mean Arterial Pressure
    const map = Math.round((systolic + 2 * diastolic) / 3);

    // Calculate confidence
    const pttValid = ptt >= 50 && ptt <= 200;
    const confidence = pttValid ? 0.95 : 0.60;

    logger.info(`📐 Age-Based PTT Formula Applied:`);
    logger.info(`   Systolic = ${a} × ln(${ptt.toFixed(2)}) + ${b}`);
    logger.info(`   Systolic = ${a} × ${lnPTT.toFixed(4)} + ${b} = ${systolic} mmHg`);
    logger.info(`   Diastolic = ${c} × ln(${ptt.toFixed(2)}) + ${d}`);
    logger.info(`   Diastolic = ${c} × ${lnPTT.toFixed(4)} + ${d} = ${diastolic} mmHg`);
    logger.info(`   MAP = ${map} mmHg, HR = ${heartRate} bpm`);

    return {
      systolic: systolic,
      diastolic: diastolic,
      map: map,
      heart_rate: heartRate,
      ptt: ptt,
      confidence: confidence,
      age_based: true,
      formula: `Age-based PTT: ${a}×ln(PTT)+${b}, ${c}×ln(PTT)+${d}`
    };
  } catch (error) {
    logger.error('BP formula error:', error.message);
    return {
      systolic: 120,
      diastolic: 80,
      map: 93,
      heart_rate: heartRate,
      confidence: 0.5
    };
  }
}

module.exports = exports;
