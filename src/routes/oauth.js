const express = require('express');
const { validateAuthRequest, authorize, token } = require('../controllers/oauthController');

const router = express.Router();

// OAuth 2.0 endpoints (all public - no auth middleware)
router.get('/validate', validateAuthRequest);
router.post('/authorize', authorize);
router.post('/token', token);

module.exports = router;
