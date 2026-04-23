const {
    getLatestSensorReading,
    readSensorReadings,
    saveSensorReading
} = require('../model/SensorReading');

const toNumber = (value, fallback = null) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const toNumberArray = (value) => {
    let input = value;

    if (typeof input === 'string') {
        const trimmed = input.trim();

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                input = JSON.parse(trimmed);
            } catch {
                input = trimmed;
            }
        }

        if (typeof input === 'string' && input.includes(',')) {
            input = input.split(',');
        }
    }

    if (!Array.isArray(input)) {
        return null;
    }

    const values = input
        .map((item) => toNumber(item))
        .filter((item) => item !== null);

    return values.length > 0 ? values : null;
};

const getLastNumber = (values) => (
    Array.isArray(values) && values.length > 0 ? values[values.length - 1] : null
);

const parseTextPayload = (payload = '') => {
    const text = String(payload).trim();

    if (!text) return {};

    try {
        return JSON.parse(text);
    } catch {
        // Continue with loose key/value parsing below.
    }

    return text.split(/\r?\n|&|,/).reduce((parsed, line) => {
        const match = line.match(/^\s*([^:=]+?)\s*[:=]\s*(-?\d+(?:\.\d+)?)\s*$/);

        if (match) {
            parsed[match[1].trim()] = match[2];
        }

        return parsed;
    }, {});
};

const getValue = (data, keys) => {
    const normalizedEntries = Object.entries(data).reduce((entries, [key, value]) => {
        const normalizedKey = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
        entries[normalizedKey] = value;
        return entries;
    }, {});

    for (const key of keys) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (Object.prototype.hasOwnProperty.call(normalizedEntries, normalizedKey)) {
            return normalizedEntries[normalizedKey];
        }
    }

    return undefined;
};

const getSensorPayload = (req) => {
    const body = typeof req.body === 'string' ? parseTextPayload(req.body) : (req.body || {});

    return {
        ...req.query,
        ...body
    };
};

const normalizeSensorData = (data) => {
    const ecgInput = getValue(data, ['ecg', 'ecg_raw', 'ecgRaw', 'ECG', 'ECG Value']);
    const ecgSamples = toNumberArray(ecgInput);
    const ecgValue = ecgSamples ? getLastNumber(ecgSamples) : toNumber(ecgInput);
    const ecgRawInput = getValue(data, ['ecg_raw', 'ecgRaw', 'ECG Value']);

    return {
        temperature: toNumber(getValue(data, ['temperature', 'temp', 'temperatureC', 'Temperature (C)'])),
        heart_rate: toNumber(getValue(data, ['heart_rate', 'heartRate', 'bpm', 'heart rate'])),
        spo2: toNumber(getValue(data, ['spo2', 'SpO2', 'oxygen'])),
        ecg: ecgSamples || ecgValue,
        ecg_raw: toNumber(ecgRawInput, ecgValue),
        lead_off_plus: toNumber(getValue(data, ['lead_off_plus', 'lo_plus', 'LO+', 'LO plus'])),
        lead_off_minus: toNumber(getValue(data, ['lead_off_minus', 'lo_minus', 'LO-', 'LO minus'])),
        ir_value: toNumber(getValue(data, ['ir_value', 'ir', 'IR Value'])),
        red_value: toNumber(getValue(data, ['red_value', 'red', 'RED Value']))
    };
};

exports.create = async (req, res) => {
    try {
        const reading = normalizeSensorData(getSensorPayload(req));

        if (
            reading.temperature === null &&
            reading.heart_rate === null &&
            reading.spo2 === null &&
            reading.ecg === null &&
            reading.ecg_raw === null
        ) {
            return res.status(400).json({ error: 'No valid sensor values were provided' });
        }

        const savedReading = await saveSensorReading(reading);
        res.status(201).json({
            message: 'Sensor data saved',
            reading: savedReading
        });
    } catch (error) {
        console.error('Sensor Save Error: ', error);
        res.status(500).json({ error: 'An error occurred while saving sensor data' });
    }
};

exports.latest = async (req, res) => {
    try {
        const reading = await getLatestSensorReading();
        res.status(200).json(reading || {});
    } catch (error) {
        console.error('Sensor Latest Error: ', error);
        res.status(500).json({ error: 'An error occurred while loading sensor data' });
    }
};

exports.history = async (req, res) => {
    try {
        const readings = await readSensorReadings();
        res.status(200).json(readings);
    } catch (error) {
        console.error('Sensor History Error: ', error);
        res.status(500).json({ error: 'An error occurred while loading sensor history' });
    }
};
