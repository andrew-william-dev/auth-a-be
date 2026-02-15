const crypto = require('crypto');
const Application = require('../models/Application');
const User = require('../models/User');
const AuthorizationCode = require('../models/AuthorizationCode');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Validate OAuth authorization request
// @route   GET /api/oauth/validate
// @access  Public
exports.validateAuthRequest = async (req, res) => {
    try {
        const { clientId, redirectUrl, code_challenge, code_challenge_method } = req.query;

        // Validate required parameters
        if (!clientId || !redirectUrl || !code_challenge || !code_challenge_method) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: clientId, redirectUrl, code_challenge, code_challenge_method',
            });
        }

        // Validate code_challenge_method
        if (code_challenge_method !== 's256') {
            return res.status(400).json({
                success: false,
                message: 'Invalid code_challenge_method. Only S256 is supported.',
            });
        }

        // Find application by clientId
        const application = await Application.findOne({ clientId });
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Invalid client ID',
            });
        }

        // Validate redirect URL
        if (application.redirectUri !== redirectUrl) {
            return res.status(400).json({
                success: false,
                message: 'Redirect URL does not match registered URI',
            });
        }

        res.status(200).json({
            success: true,
            application: {
                name: application.name,
                clientId: application.clientId,
            },
        });
    } catch (error) {
        console.error('Validate auth request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Authorize user and generate authorization code
// @route   POST /api/oauth/authorize
// @access  Public
exports.authorize = async (req, res) => {
    try {
        const { email, password, clientId, redirectUrl, code_challenge, code_challenge_method } = req.body;

        // Validate required parameters
        if (!email || !password || !clientId || !redirectUrl || !code_challenge || !code_challenge_method) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
            });
        }

        // Validate code_challenge_method
        if (code_challenge_method !== 'S256') {
            return res.status(400).json({
                success: false,
                message: 'Invalid code_challenge_method. Only S256 is supported.',
            });
        }

        // Find application by clientId
        const application = await Application.findOne({ clientId });
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Invalid client ID',
            });
        }

        // Validate redirect URL
        if (application.redirectUri !== redirectUrl) {
            return res.status(400).json({
                success: false,
                message: 'Redirect URL does not match registered URI',
            });
        }

        // Authenticate user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if user has access to the application
        const userAccess = user.appAccess.find(
            access => access.applicationId.toString() === application._id.toString()
        );

        if (!userAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this application. Please request access first.',
            });
        }

        // Generate authorization code
        const authCode = crypto.randomBytes(32).toString('hex');

        // Store authorization code with PKCE parameters
        await AuthorizationCode.create({
            code: authCode,
            clientId,
            userId: user._id,
            codeChallenge: code_challenge,
            codeChallengeMethod: code_challenge_method,
            redirectUrl,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });

        res.status(200).json({
            success: true,
            code: authCode,
        });
    } catch (error) {
        console.error('Authorize error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Exchange authorization code for access token
// @route   POST /api/oauth/token
// @access  Public
exports.token = async (req, res) => {
    try {
        const { code, code_verifier, clientId } = req.body;

        // Validate required parameters
        if (!code || !code_verifier || !clientId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: code, code_verifier, clientId',
            });
        }

        // Find authorization code
        const authCode = await AuthorizationCode.findOne({ code }).populate('userId');
        if (!authCode) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired authorization code',
            });
        }

        // Verify code hasn't expired
        if (new Date() > authCode.expiresAt) {
            await AuthorizationCode.deleteOne({ _id: authCode._id });
            return res.status(400).json({
                success: false,
                message: 'Authorization code has expired',
            });
        }

        // Verify clientId matches
        if (authCode.clientId !== clientId) {
            return res.status(400).json({
                success: false,
                message: 'Client ID mismatch',
            });
        }

        // Verify code_verifier using PKCE
        const hash = crypto.createHash('sha256').update(code_verifier).digest('base64url');
        if (hash !== authCode.codeChallenge) {
            return res.status(400).json({
                success: false,
                message: 'Invalid code verifier',
            });
        }

        // Get application and user access info
        const application = await Application.findOne({ clientId });
        const user = authCode.userId;
        const userAccess = user.appAccess.find(
            access => access.applicationId.toString() === application._id.toString()
        );

        // Generate JWT token with application-specific claims
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                email: user.email,
                applicationId: application._id,
                clientId: application.clientId,
                role: userAccess.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        // Delete used authorization code
        await AuthorizationCode.deleteOne({ _id: authCode._id });

        res.status(200).json({
            success: true,
            access_token: token,
            token_type: 'Bearer',
            expires_in: 2592000, // 30 days in seconds
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
            role: userAccess.role,
        });
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
