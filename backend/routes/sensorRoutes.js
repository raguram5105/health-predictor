const express = require('express');
const router = express.Router();
const sensorController = require('../controller/sensorController');

router.post('/sensor', sensorController.create);
router.get('/sensor/latest', sensorController.latest);
router.get('/sensor/history', sensorController.history);

module.exports = router;
