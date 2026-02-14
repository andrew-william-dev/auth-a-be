const express = require('express');
const router = express.Router();
const {
    getRegistrationTips,
    getFormatSamples,
    getApiReference,
} = require('../controllers/documentationController');

// Public routes - no authentication required
router.get('/registration-tips', getRegistrationTips);
router.get('/format-samples', getFormatSamples);
router.get('/api-reference', getApiReference);

module.exports = router;
