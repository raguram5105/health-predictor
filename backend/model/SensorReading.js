const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'sensor-readings.json');
const maxReadings = 100;

const ensureStore = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '[]', 'utf8');
  }
};

const readSensorReadings = async () => {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');

  try {
    const readings = JSON.parse(raw);
    return Array.isArray(readings) ? readings : [];
  } catch {
    return [];
  }
};

const saveSensorReading = async (reading) => {
  const readings = await readSensorReadings();
  const savedReading = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ...reading,
    createdAt: new Date().toISOString()
  };

  readings.push(savedReading);
  const latestReadings = readings.slice(-maxReadings);

  await fs.writeFile(dataFile, JSON.stringify(latestReadings, null, 2), 'utf8');
  return savedReading;
};

const getLatestSensorReading = async () => {
  const readings = await readSensorReadings();
  return readings[readings.length - 1] || null;
};

module.exports = {
  getLatestSensorReading,
  readSensorReadings,
  saveSensorReading
};
