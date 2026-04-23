const { readPredictions, savePrediction } = require('../model/Prediction');
const { getLatestSensorReading } = require('../model/SensorReading');

const clamp = (value, min = 1, max = 95) => Math.max(min, Math.min(max, Math.round(value)));

const toNumber = (value, fallback = null) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const latestNumber = (value, fallback = null) => {
    if (!Array.isArray(value)) {
        return toNumber(value, fallback);
    }

    for (let index = value.length - 1; index >= 0; index -= 1) {
        const number = toNumber(value[index]);

        if (number !== null) {
            return number;
        }
    }

    return fallback;
};

const calculateBmi = (heightCm, weightKg) => {
    try {
        const h = parseFloat(heightCm) / 100;
        const w = parseFloat(weightKg);
        if (h > 0) return w / (h * h);
        return 0;
    } catch {
        return 0;
    }
};

const getLatestFreshSensorReading = async () => {
    const reading = await getLatestSensorReading();

    if (!reading?.createdAt) {
        return null;
    }

    const ageMs = Date.now() - new Date(reading.createdAt).getTime();
    const maxSensorAgeMs = 60 * 1000;

    return ageMs <= maxSensorAgeMs ? reading : null;
};

const statusFor = (probability) => (probability >= 40 ? 'warning' : 'safe');

const disease = (name, probability, desc, factors = []) => ({
    disease: name,
    probability: `${clamp(probability)}%`,
    status: statusFor(probability),
    desc,
    factors
});

const buildDiseasePredictions = ({ bmi, smoking, alcohol, activityLevel, sensors }) => {
    const heartRate = toNumber(sensors?.heart_rate ?? sensors?.heartRate);
    const spo2 = toNumber(sensors?.spo2);
    const temperature = toNumber(sensors?.temperature);
    const ecg = latestNumber(sensors?.ecg ?? sensors?.ecg_raw);
    const leadOff = sensors?.lead_off_plus === 1 || sensors?.lead_off_minus === 1;
    const hasEcgSignal = ecg !== null && !leadOff;

    const diseaseRisks = [];

    const highBmi = bmi >= 25;
    const obese = bmi >= 30;
    const sedentary = activityLevel === 'sedentary';
    const lowActivity = activityLevel === 'light' || sedentary;
    const smoker = smoking === 'occasional' || smoking === 'regular';
    const regularSmoker = smoking === 'regular';
    const regularAlcohol = alcohol === 'regular';
    const tachycardia = heartRate !== null && heartRate > 100;
    const bradycardia = heartRate !== null && heartRate < 60;
    const lowSpo2 = spo2 !== null && spo2 < 95;
    const severeLowSpo2 = spo2 !== null && spo2 < 90;
    const fever = temperature !== null && temperature >= 38;
    const highFever = temperature !== null && temperature >= 39;
    const hypothermia = temperature !== null && temperature < 35;
    const abnormalEcg = hasEcgSignal && (ecg < 0 || ecg > 900);

    diseaseRisks.push(disease(
        'Cardiac Arrhythmia',
        8 + (tachycardia ? 28 : 0) + (bradycardia ? 22 : 0) + (abnormalEcg ? 32 : 0) + (lowSpo2 ? 8 : 0),
        'Heart rate and ECG changes can indicate rhythm irregularities that need clinical review.',
        ['heart rate', 'ECG', 'SpO2']
    ));

    diseaseRisks.push(disease(
        'Respiratory Distress or Hypoxemia',
        6 + (lowSpo2 ? 34 : 0) + (severeLowSpo2 ? 28 : 0) + (tachycardia ? 8 : 0) + (smoker ? 8 : 0),
        'Low oxygen saturation is associated with breathing difficulty and reduced oxygen delivery.',
        ['SpO2', 'heart rate', 'smoking']
    ));

    diseaseRisks.push(disease(
        'Fever or Acute Infection',
        5 + (fever ? 38 : 0) + (highFever ? 18 : 0) + (tachycardia ? 10 : 0) + (lowSpo2 ? 8 : 0),
        'Raised temperature, especially with fast heart rate or low oxygen, can suggest infection or inflammation.',
        ['temperature', 'heart rate', 'SpO2']
    ));

    diseaseRisks.push(disease(
        'Hypothermia or Low Body Temperature',
        3 + (hypothermia ? 50 : 0) + (bradycardia ? 10 : 0),
        'Low body temperature can affect heart rhythm and circulation.',
        ['temperature', 'heart rate']
    ));

    diseaseRisks.push(disease(
        'Cardiovascular Disease',
        12 + (highBmi ? 14 : 0) + (obese ? 14 : 0) + (regularSmoker ? 18 : smoker ? 9 : 0) + (lowActivity ? 8 : 0) + (tachycardia ? 8 : 0),
        'BMI, smoking, activity level, and heart-rate strain are combined into a cardiovascular risk estimate.',
        ['BMI', 'smoking', 'activity', 'heart rate']
    ));

    diseaseRisks.push(disease(
        'Type 2 Diabetes',
        8 + (highBmi ? 18 : 0) + (obese ? 18 : 0) + (sedentary ? 12 : 0),
        'Elevated BMI and low activity are commonly associated with insulin resistance.',
        ['BMI', 'activity']
    ));

    diseaseRisks.push(disease(
        'Metabolic Syndrome',
        10 + (highBmi ? 16 : 0) + (obese ? 14 : 0) + (sedentary ? 14 : 0) + (regularAlcohol ? 6 : 0),
        'Weight, inactivity, and alcohol intake can cluster with metabolic risk factors.',
        ['BMI', 'activity', 'alcohol']
    ));

    diseaseRisks.push(disease(
        'COPD or Chronic Respiratory Risk',
        7 + (regularSmoker ? 28 : smoker ? 14 : 0) + (lowSpo2 ? 18 : 0) + (severeLowSpo2 ? 16 : 0),
        'Smoking history and oxygen saturation are used to estimate chronic respiratory risk.',
        ['smoking', 'SpO2']
    ));

    diseaseRisks.push(disease(
        'Sleep Apnea Risk',
        6 + (obese ? 24 : highBmi ? 12 : 0) + (lowSpo2 ? 15 : 0) + (tachycardia ? 5 : 0),
        'Higher BMI and oxygen dips can be associated with sleep-related breathing problems.',
        ['BMI', 'SpO2', 'heart rate']
    ));

    diseaseRisks.push(disease(
        'Anemia or Poor Oxygen Delivery',
        5 + (lowSpo2 ? 18 : 0) + (tachycardia ? 12 : 0) + (bradycardia ? 5 : 0),
        'Low oxygen readings with heart-rate changes can suggest reduced oxygen delivery.',
        ['SpO2', 'heart rate']
    ));

    diseaseRisks.push(disease(
        'Liver Complications',
        5 + (regularAlcohol ? 30 : alcohol === 'occasional' ? 10 : 0) + (obese ? 8 : 0),
        'Alcohol intake and obesity can increase liver strain risk.',
        ['alcohol', 'BMI']
    ));

    diseaseRisks.push(disease(
        'Heat Stress or Dehydration',
        4 + (temperature !== null && temperature >= 37.5 ? 12 : 0) + (fever ? 18 : 0) + (tachycardia ? 14 : 0),
        'High temperature and fast heart rate can occur with heat stress or dehydration.',
        ['temperature', 'heart rate']
    ));

    diseaseRisks.push(disease(
        'ECG Lead-Off or Sensor Contact Issue',
        leadOff ? 75 : 4,
        'Lead-off flags mean the ECG electrodes may not be attached properly, so ECG-based disease risk is less reliable.',
        ['ECG lead status']
    ));

    return diseaseRisks
        .filter((item) => item.disease !== 'ECG Lead-Off or Sensor Contact Issue' || leadOff)
        .sort((a, b) => parseInt(b.probability, 10) - parseInt(a.probability, 10));
};

const buildRecommendations = ({ diseaseRisks, sensors }) => {
    const recommendations = [
        'Use these results as a screening estimate, not a medical diagnosis.',
        'Repeat the measurement after sitting still for a few minutes to improve sensor reliability.'
    ];

    const topDisease = diseaseRisks[0]?.disease;
    const spo2 = toNumber(sensors?.spo2);
    const temperature = toNumber(sensors?.temperature);
    const heartRate = toNumber(sensors?.heart_rate ?? sensors?.heartRate);

    if (spo2 !== null && spo2 < 95) {
        recommendations.push('If oxygen saturation remains below 95% or breathing feels difficult, seek medical advice.');
    }

    if (temperature !== null && temperature >= 38) {
        recommendations.push('Monitor temperature, hydration, and symptoms if fever persists.');
    }

    if (heartRate !== null && (heartRate > 100 || heartRate < 60)) {
        recommendations.push('Recheck heart rate at rest and consult a clinician if abnormal values continue.');
    }

    if (topDisease) {
        recommendations.push(`Highest current estimate: ${topDisease}. Review the listed factors and recent sensor readings.`);
    }

    return recommendations.slice(0, 5);
};

exports.predict = async (req, res) => {
    try {
        const data = req.body || {};

        const height = data.height || 170;
        const weight = data.weight || 70;
        const smoking = data.smoking || 'no';
        const alcohol = data.alcohol || 'no';
        const activityLevel = data.activityLevel || 'moderate';

        const bmi = calculateBmi(height, weight);
        const latestSensors = await getLatestFreshSensorReading();
        const primaryConcerns = buildDiseasePredictions({
            bmi,
            smoking,
            alcohol,
            activityLevel,
            sensors: latestSensors
        });

        const averageTopRisk = primaryConcerns
            .slice(0, 5)
            .reduce((total, item) => total + parseInt(item.probability, 10), 0) / Math.max(primaryConcerns.slice(0, 5).length, 1);

        const riskScore = clamp(averageTopRisk);

        let overallRisk = 'Severe Risk';
        if (riskScore < 25) overallRisk = 'Low Risk';
        else if (riskScore < 50) overallRisk = 'Moderate Risk';
        else if (riskScore < 75) overallRisk = 'High Risk';

        const sensorSummary = latestSensors ? {
            temperature: latestSensors.temperature ?? null,
            heart_rate: latestSensors.heart_rate ?? latestSensors.heartRate ?? null,
            spo2: latestSensors.spo2 ?? null,
            ecg: latestNumber(latestSensors.ecg ?? latestSensors.ecg_raw),
            ecg_samples: Array.isArray(latestSensors.ecg) ? latestSensors.ecg : [],
            createdAt: latestSensors.createdAt
        } : null;

        const recommendations = buildRecommendations({
            diseaseRisks: primaryConcerns,
            sensors: latestSensors
        });

        const result = {
            overallRisk,
            riskScore,
            sensorSummary,
            primaryConcerns,
            recommendations
        };

        await savePrediction({
            inputs: { height, weight, smoking, alcohol, activityLevel },
            sensors: sensorSummary,
            riskScore: result.riskScore,
            overallRisk: result.overallRisk,
            primaryConcerns: result.primaryConcerns,
            recommendations: result.recommendations
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Prediction Error: ", error);
        res.status(500).json({ error: 'An error occurred during prediction' });
    }
};

exports.history = async (req, res) => {
    try {
        const predictions = await readPredictions();
        res.status(200).json(predictions);
    } catch (error) {
        console.error("Prediction History Error: ", error);
        res.status(500).json({ error: 'An error occurred while loading prediction history' });
    }
};
