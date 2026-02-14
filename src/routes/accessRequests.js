const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    requestAccess,
    getUserRequests,
    getPendingRequests,
    approveRequest,
    denyRequest,
} = require('../controllers/accessRequestController');

// All routes are protected
router.use(protect);

// Request access to an application
router.post('/', requestAccess);

// Get user's own requests
router.get('/my-requests', getUserRequests);

// Get pending requests for an application (admin only)
router.get('/pending/:appId', getPendingRequests);

// Approve a request (admin only)
router.put('/:id/approve', approveRequest);

// Deny a request (admin only)
router.put('/:id/deny', denyRequest);

module.exports = router;
