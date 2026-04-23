const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'predictions.json');

const ensureStore = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, '[]', 'utf8');
  }
};

const readPredictions = async () => {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');

  try {
    const predictions = JSON.parse(raw);
    return Array.isArray(predictions) ? predictions : [];
  } catch {
    return [];
  }
};

const savePrediction = async (prediction) => {
  const predictions = await readPredictions();
  const savedPrediction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ...prediction,
    createdAt: new Date().toISOString()
  };

  predictions.push(savedPrediction);
  await fs.writeFile(dataFile, JSON.stringify(predictions, null, 2), 'utf8');

  return savedPrediction;
};

module.exports = {
  readPredictions,
  savePrediction
};
