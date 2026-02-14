const User = require('../models/User');
const Application = require('../models/Application');

// @desc    Get all users with access to an application (admin only)
// @route   GET /api/applications/:id/users
// @access  Private
exports.getApplicationUsers = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if application exists
        const application = await Application.findById(id);
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
                message: 'You are not authorized to view users for this application',
            });
        }

        // Find all users who have access to this app
        const users = await User.find({
            'appAccess.applicationId': id,
        }).select('username email appAccess');

        // Filter and format the user data
        const usersWithAccess = users.map(user => {
            const access = user.appAccess.find(
                a => a.applicationId.toString() === id
            );
            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: access.role,
                grantedAt: access.grantedAt,
            };
        });

        res.status(200).json({
            success: true,
            users: usersWithAccess,
        });
    } catch (error) {
        console.error('Get application users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Remove user access from application (admin only)
// @route   DELETE /api/applications/:id/users/:userId
// @access  Private
exports.removeUserAccess = async (req, res) => {
    try {
        const { id, userId } = req.params;

        // Check if application exists
        const application = await Application.findById(id);
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
                message: 'You are not authorized to remove users from this application',
            });
        }

        // Remove the access from user's appAccess array
        const result = await User.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    appAccess: { applicationId: id },
                },
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'User access removed successfully',
        });
    } catch (error) {
        console.error('Remove user access error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
