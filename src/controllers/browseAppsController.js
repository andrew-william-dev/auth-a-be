const Application = require('../models/Application');

// @desc    Get all available applications (for browsing and requesting access)
// @route   GET /api/applications/browse/all
// @access  Private
exports.getAllApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        // Get all applications
        const applications = await Application.find()
            .populate('userId', 'username')
            .populate('admins', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Add access information for each app
        const applicationsWithAccess = applications.map(app => {
            const isOwner = app.userId._id.toString() === req.user.id;
            const isAdmin = app.admins.some(admin => admin._id.toString() === req.user.id);

            // Get user's current access to this app
            const userAccess = user.appAccess.find(
                access => access.applicationId.toString() === app._id.toString()
            );

            // Determine which roles user can request
            const availableRoles = app.roles.filter(role => {
                // Can't request if user already has this role
                return !userAccess || userAccess.role !== role;
            });

            return {
                ...app,
                isOwner,
                isAdmin,
                userRole: userAccess?.role || null,
                hasAccess: !!userAccess || isOwner,
                availableRoles,
            };
        });

        // Get total count
        const total = await Application.countDocuments();

        res.status(200).json({
            success: true,
            applications: applicationsWithAccess,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
