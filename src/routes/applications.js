const express = require('express');
const router = express.Router();
const {
    getApplications,
    getApplication,
    getStats,
    createApplication,
    updateApplication,
    deleteApplication,
} = require('../controllers/applicationController');
const { getAllApplications } = require('../controllers/browseAppsController');
const { getApplicationUsers, removeUserAccess } = require('../controllers/userAccessController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/').get(getApplications).post(createApplication);

router.get('/browse/all', getAllApplications);

router.get('/stats', getStats);

router.route('/:id').get(getApplication).put(updateApplication).delete(deleteApplication);

// User access management routes
router.get('/:id/users', getApplicationUsers);
router.delete('/:id/users/:userId', removeUserAccess);

module.exports = router;
