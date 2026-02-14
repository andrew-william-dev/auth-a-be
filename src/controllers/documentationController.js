// @desc    Get registration tips
// @route   GET /api/docs/registration-tips
// @access  Public
exports.getRegistrationTips = async (req, res) => {
    try {
        const tips = {
            title: 'Application Registration Best Practices',
            sections: [
                {
                    heading: '1. Naming Your Application',
                    tips: [
                        'Use a clear, descriptive name that identifies your application',
                        'Avoid special characters and keep it under 50 characters',
                        'Use title case (e.g., "My Awesome App" not "my awesome app")',
                    ],
                },
                {
                    heading: '2. Redirect URI Configuration',
                    tips: [
                        'Always use HTTPS in production environments',
                        'Specify the exact callback URL your app will use',
                        'For development, you can use http://localhost with a port',
                        'Do not use wildcards in production redirect URIs',
                        'Example: https://myapp.com/auth/callback or http://localhost:3000/callback',
                    ],
                },
                {
                    heading: '3. Custom Roles (IMPORTANT)',
                    tips: [
                        '⚠️ MANDATORY: Every application must have at least one "admin" role',
                        'The admin role is automatically assigned to the application creator',
                        'Define additional roles that match your application\'s permission model',
                        'Use lowercase, hyphenated names (e.g., "content-editor", "viewer")',
                        'Common roles: admin, editor, viewer, contributor, moderator',
                        'Keep role names descriptive and meaningful',
                    ],
                },
                {
                    heading: '4. Security Best Practices',
                    tips: [
                        'Store your Client Secret securely (use environment variables)',
                        'Never commit secrets to version control or share them publicly',
                        'The Client Secret is shown ONLY ONCE during registration - save it immediately',
                        'Rotate your Client Secret periodically for enhanced security',
                        'Use different credentials for dev/staging/production environments',
                        'Implement proper error handling for authentication failures',
                    ],
                },
            ],
        };

        res.status(200).json({
            success: true,
            data: tips,
        });
    } catch (error) {
        console.error('Get registration tips error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get format samples
// @route   GET /api/docs/format-samples
// @access  Public
exports.getFormatSamples = async (req, res) => {
    try {
        const samples = {
            title: 'Code Samples and Format Examples',
            sections: [
                {
                    heading: 'Authentication Request',
                    language: 'javascript',
                    code: `// Example: Making an authenticated API request
const axios = require('axios');

const config = {
  headers: {
    'Authorization': \`Bearer \${YOUR_ACCESS_TOKEN}\`,
    'Content-Type': 'application/json'
  }
};

axios.get('https://api.example.com/data', config)
  .then(response => console.log(response.data))
  .catch(error => console.error(error));`,
                },
                {
                    heading: 'OAuth 2.0 Flow',
                    language: 'javascript',
                    code: `// Example: OAuth 2.0 Authorization Code Flow
// Step 1: Redirect user to authorization endpoint
const authUrl = \`https://auth.example.com/authorize?
  client_id=\${CLIENT_ID}&
  redirect_uri=\${REDIRECT_URI}&
  response_type=code&
  scope=read write\`;

window.location.href = authUrl;

// Step 2: Handle callback and exchange code for token
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  const tokenResponse = await axios.post('https://auth.example.com/token', {
    grant_type: 'authorization_code',
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  });
  
  const { access_token } = tokenResponse.data;
  // Store access_token securely
});`,
                },
                {
                    heading: 'Environment Variables',
                    language: 'bash',
                    code: `# .env file example
CLIENT_ID=app_1a2b3c4d5e6f7g8h
CLIENT_SECRET=secret_9i8h7g6f5e4d3c2b1a
REDIRECT_URI=https://myapp.com/callback
API_BASE_URL=https://api.example.com`,
                },
                {
                    heading: 'Redirect URI Examples',
                    language: 'text',
                    code: `# Production
https://myapp.com/auth/callback
https://app.example.com/oauth/redirect

# Development
http://localhost:3000/callback
http://localhost:8080/auth/callback

# Mobile (Deep Links)
myapp://oauth/callback
com.example.myapp://redirect`,
                },
            ],
        };

        res.status(200).json({
            success: true,
            data: samples,
        });
    } catch (error) {
        console.error('Get format samples error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get API reference
// @route   GET /api/docs/api-reference
// @access  Public
exports.getApiReference = async (req, res) => {
    try {
        const apiDocs = {
            title: 'DevPortal API Reference',
            baseUrl: 'https://api.devportal.com',
            endpoints: [
                {
                    category: 'Authentication',
                    endpoints: [
                        {
                            method: 'POST',
                            path: '/api/auth/register',
                            description: 'Register a new user account',
                            auth: false,
                            body: {
                                username: 'string (required)',
                                email: 'string (required)',
                                password: 'string (required, min 8 chars)',
                            },
                            response: {
                                success: true,
                                token: 'JWT token',
                                user: { id: 'string', username: 'string', email: 'string' },
                            },
                        },
                        {
                            method: 'POST',
                            path: '/api/auth/login',
                            description: 'Login to existing account',
                            auth: false,
                            body: {
                                email: 'string (required)',
                                password: 'string (required)',
                            },
                            response: {
                                success: true,
                                token: 'JWT token',
                                user: { id: 'string', username: 'string', email: 'string' },
                            },
                        },
                    ],
                },
                {
                    category: 'Applications',
                    endpoints: [
                        {
                            method: 'GET',
                            path: '/api/applications',
                            description: 'Get paginated list of applications user has access to',
                            auth: true,
                            query: {
                                page: 'number (default: 1)',
                                limit: 'number (default: 10)',
                            },
                            response: {
                                success: true,
                                applications: 'array',
                                pagination: { page: 1, limit: 10, total: 50, pages: 5 },
                            },
                        },
                        {
                            method: 'POST',
                            path: '/api/applications',
                            description: 'Create a new application',
                            auth: true,
                            body: {
                                name: 'string (required)',
                                redirectUri: 'string (required)',
                                roles: 'array of strings (optional)',
                            },
                            response: {
                                success: true,
                                application: {
                                    clientId: 'string',
                                    clientSecret: 'string (shown only once)',
                                },
                            },
                        },
                    ],
                },
                {
                    category: 'Access Requests',
                    endpoints: [
                        {
                            method: 'POST',
                            path: '/api/access-requests',
                            description: 'Request access to an application',
                            auth: true,
                            body: {
                                applicationId: 'string (required)',
                                requestedRole: 'string (required)',
                                message: 'string (optional)',
                            },
                        },
                        {
                            method: 'GET',
                            path: '/api/access-requests/my-requests',
                            description: 'Get all access requests made by current user',
                            auth: true,
                        },
                    ],
                },
            ],
        };

        res.status(200).json({
            success: true,
            data: apiDocs,
        });
    } catch (error) {
        console.error('Get API reference error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
