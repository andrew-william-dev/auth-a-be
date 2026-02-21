const Application = require('../models/Application');

// @desc    Get all applications user has access to
// @route   GET /api/applications
// @access  Private
exports.getApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        // Get app IDs user has access to
        const accessibleAppIds = user.appAccess.map(access => access.applicationId);

        // Get applications user owns OR has access to
        const applications = await Application.find({
            $or: [
                { userId: req.user.id },
                { _id: { $in: accessibleAppIds } },
            ],
        })
            .populate('admins', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Add isAdmin flag for each app
        const applicationsWithRole = applications.map(app => ({
            ...app,
            isAdmin: app.admins.some(admin => admin._id.toString() === req.user.id),
            userRole: user.appAccess.find(access =>
                access.applicationId.toString() === app._id.toString()
            )?.role || (app.userId.toString() === req.user.id ? 'owner' : null),
        }));

        // Get total count
        const total = await Application.countDocuments({
            $or: [
                { userId: req.user.id },
                { _id: { $in: accessibleAppIds } },
            ],
        });

        res.status(200).json({
            success: true,
            applications: applicationsWithRole,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get statistics for logged in user
// @route   GET /api/applications/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        const accessibleAppIds = user.appAccess.map(access => access.applicationId);

        const query = {
            $or: [
                { userId: req.user.id },
                { _id: { $in: accessibleAppIds } },
            ],
        };

        const total = await Application.countDocuments(query);
        const active = await Application.countDocuments({
            ...query,
            status: 'active',
        });
        const pending = await Application.countDocuments({
            ...query,
            status: 'pending',
        });

        res.status(200).json({
            success: true,
            stats: {
                total,
                active,
                pending,
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get single application by ID
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('admins', 'username');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Check if user has access to this app
        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        const isOwner = application.userId.toString() === req.user.id;
        const hasAccess = user.appAccess.some(
            access => access.applicationId.toString() === application._id.toString()
        );
        const isAdmin = application.admins.some(
            adminId => adminId._id.toString() === req.user.id
        );

        if (!isOwner && !hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this application',
            });
        }

        // Add role information
        const userRole = user.appAccess.find(access =>
            access.applicationId.toString() === application._id.toString()
        )?.role || (isOwner ? 'owner' : null);

        res.status(200).json({
            success: true,
            application: {
                ...application.toObject(),
                isAdmin,
                userRole,
            },
        });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Private
exports.createApplication = async (req, res) => {
    try {
        const { name, redirectUri, roles } = req.body;

        // Validation
        if (!name || !redirectUri) {
            return res.status(400).json({
                success: false,
                message: 'Please provide application name and redirect URI',
            });
        }

        // Create application with creator as admin
        const application = await Application.create({
            name,
            redirectUri,
            roles: roles || [],
            userId: req.user.id,
            admins: [req.user.id], // Auto-assign creator as admin
        });

        // Grant the creator access to their own app in the User model
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.id, {
            $push: {
                appAccess: {
                    applicationId: application._id,
                    role: 'admin',
                    grantedAt: new Date(),
                },
            },
        });

        // Get the application with the client secret (only shown once)
        const appWithSecret = await Application.findById(application._id).select(
            '+clientSecret'
        );

        res.status(201).json({
            success: true,
            application: appWithSecret,
            message: 'Application created successfully. Please save your Client Secret securely.',
        });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};


// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
exports.updateApplication = async (req, res) => {
    try {
        const { name, redirectUri, roles, status } = req.body;

        // Find application
        let application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Make sure user is admin of the application
        const isAdmin = application.admins.some(
            adminId => adminId.toString() === req.user.id
        );

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update this application',
            });
        }

        // Update application
        application = await Application.findByIdAndUpdate(
            req.params.id,
            {
                name: name || application.name,
                redirectUri: redirectUri || application.redirectUri,
                roles: roles || application.roles,
                status: status || application.status,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            application,
        });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
exports.deleteApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Make sure user is admin of the application
        const isAdmin = application.admins.some(
            adminId => adminId.toString() === req.user.id
        );

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete this application',
            });
        }

        await application.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Application deleted successfully',
        });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
