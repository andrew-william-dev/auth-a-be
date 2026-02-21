const express = require('express');
const { validateAuthRequest, authorize, authorizeWithToken, token } = require('../controllers/oauthController');

const router = express.Router();

// OAuth 2.0 endpoints (all public - no auth middleware)
router.get('/validate', validateAuthRequest);
router.post('/authorize', authorize);
router.post('/authorize-with-token', authorizeWithToken); // SSO: bypass login if session exists
router.post('/token', token);

module.exports = router;
