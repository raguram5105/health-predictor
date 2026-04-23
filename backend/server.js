require('dotenv').config();
const express = require('express');
const cors = require('cors');

const predictionRoutes = require('./routes/predictionRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const authRoutes = require('./routes/authRoutes');
const sensorController = require('./controller/sensorController');

const app = express();
const PORT = process.env.PORT || 5000;
const ESP_PORT = process.env.ESP_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('Using local JSON storage for prediction data.');

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        storage: 'local-json'
    });
});

app.use('/api', predictionRoutes);
app.use('/api', sensorRoutes);
app.use('/api', authRoutes);

app.post('/data', express.text({ type: '*/*' }), sensorController.create);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

if (String(ESP_PORT) !== String(PORT)) {
    app.listen(ESP_PORT, () => console.log(`ESP32 data endpoint running on port ${ESP_PORT}`));
}
