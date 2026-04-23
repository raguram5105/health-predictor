const express = require('express');
const router = express.Router();
const predictionController = require('../controller/predictionController');

router.post('/predict', predictionController.predict);
router.get('/predictions', predictionController.history);

module.exports = router;
