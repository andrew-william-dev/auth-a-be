const AccessRequest = require('../models/AccessRequest');
const Application = require('../models/Application');
const User = require('../models/User');

// @desc    Request access to an application
// @route   POST /api/access-requests
// @access  Private
exports.requestAccess = async (req, res) => {
    try {
        const { applicationId, requestedRole, message } = req.body;

        // Validation
        if (!applicationId || !requestedRole) {
            return res.status(400).json({
                success: false,
                message: 'Please provide applicationId and requestedRole',
            });
        }

        // Check if application exists
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Check if user already has this specific role
        const user = await User.findById(req.user._id);
        const existingAccess = user.appAccess.find(
            access => access.applicationId.toString() === applicationId && access.role === requestedRole
        );

        if (existingAccess) {
            return res.status(400).json({
                success: false,
                message: 'You already have this role for this application',
            });
        }

        // Check if there's already a pending request for this specific role
        const existingRequest = await AccessRequest.findOne({
            userId: req.user._id,
            applicationId,
            requestedRole,
            status: 'pending',
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request for this role',
            });
        }

        // Create access request
        const accessRequest = await AccessRequest.create({
            userId: req.user._id,
            applicationId,
            requestedRole,
            message,
        });

        await accessRequest.populate('applicationId', 'name');

        res.status(201).json({
            success: true,
            accessRequest,
        });
    } catch (error) {
        console.error('Request access error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get user's access requests
// @route   GET /api/access-requests/my-requests
// @access  Private
exports.getUserRequests = async (req, res) => {
    try {
        const requests = await AccessRequest.find({ userId: req.user._id })
            .populate('applicationId', 'name')
            .populate('reviewedBy', 'username')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            requests,
        });
    } catch (error) {
        console.error('Get user requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get pending requests for an application (admin only)
// @route   GET /api/access-requests/pending/:appId
// @access  Private
exports.getPendingRequests = async (req, res) => {
    try {
        const { appId } = req.params;

        // Check if application exists
        const application = await Application.findById(appId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Check if user is admin of the app
        const isAdmin = application.admins.some(
            adminId => adminId.toString() === req.user._id.toString()
        );

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view requests for this application',
            });
        }

        // Get pending requests
        const requests = await AccessRequest.find({
            applicationId: appId,
            status: 'pending',
        })
            .populate('userId', 'username email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            requests,
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Approve access request (admin only)
// @route   PUT /api/access-requests/:id/approve
// @access  Private
exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the request
        const accessRequest = await AccessRequest.findById(id).populate('applicationId');
        if (!accessRequest) {
            return res.status(404).json({
                success: false,
                message: 'Access request not found',
            });
        }

        // Check if already processed
        if (accessRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This request has already been processed',
            });
        }

        // Check if user is admin of the app
        const isAdmin = accessRequest.applicationId.admins.some(
            adminId => adminId.toString() === req.user._id.toString()
        );

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to approve this request',
            });
        }

        // Update request status
        accessRequest.status = 'approved';
        accessRequest.reviewedBy = req.user._id;
        accessRequest.reviewedAt = Date.now();
        await accessRequest.save();

        // Grant access to user
        await User.findByIdAndUpdate(accessRequest.userId, {
            $push: {
                appAccess: {
                    applicationId: accessRequest.applicationId._id,
                    role: accessRequest.requestedRole,
                },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Access request approved',
            accessRequest,
        });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Deny access request (admin only)
// @route   PUT /api/access-requests/:id/deny
// @access  Private
exports.denyRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the request
        const accessRequest = await AccessRequest.findById(id).populate('applicationId');
        if (!accessRequest) {
            return res.status(404).json({
                success: false,
                message: 'Access request not found',
            });
        }

        // Check if already processed
        if (accessRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This request has already been processed',
            });
        }

        // Check if user is admin of the app
        const isAdmin = accessRequest.applicationId.admins.some(
            adminId => adminId.toString() === req.user._id.toString()
        );

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to deny this request',
            });
        }

        // Update request status
        accessRequest.status = 'denied';
        accessRequest.reviewedBy = req.user._id;
        accessRequest.reviewedAt = Date.now();
        await accessRequest.save();

        res.status(200).json({
            success: true,
            message: 'Access request denied',
            accessRequest,
        });
    } catch (error) {
        console.error('Deny request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
