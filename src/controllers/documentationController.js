// @desc    Get app registration flow guide
// @route   GET /api/docs/registration-tips
// @access  Public
exports.getRegistrationTips = async (req, res) => {
    try {
        const data = {
            title: 'Registering an Application',
            intro: 'Follow these steps to register your application on DevPortal and get your OAuth credentials.',
            sections: [
                {
                    heading: 'Step 1 — Sign In to DevPortal',
                    steps: [
                        'Go to the DevPortal login page and sign in with your account.',
                        'If you don\'t have an account, click "Sign Up" and create one — it\'s free.',
                    ],
                },
                {
                    heading: 'Step 2 — Register Your Application',
                    steps: [
                        'From the Dashboard, click the "Register New App" button.',
                        'Fill in your Application Name — use something clear that identifies your app.',
                        'Enter your Redirect URI — this is the URL DevPortal will send users back to after they log in (e.g. https://yourapp.com/callback).',
                        'Optionally define custom roles such as "viewer", "editor", or "admin" to control what users can do inside your app.',
                        'Click Submit to create the application.',
                    ],
                },
                {
                    heading: 'Step 3 — Save Your Credentials',
                    steps: [
                        'After registration, you will be shown your Client ID and Client Secret.',
                        '⚠️ Save your Client Secret immediately — it is shown only once and cannot be retrieved later.',
                        'Your Client ID is always visible from the Dashboard and can be copied anytime.',
                    ],
                },
                {
                    heading: 'Step 4 — Manage Your App',
                    steps: [
                        'From the Dashboard, click on your app to view its details.',
                        'You can edit the app name, redirect URI, and roles at any time.',
                        'Use the "Manage Users" tab to see who has access to your app and what role they have.',
                        'You can revoke a user\'s access at any time from the Manage Users view.',
                        'As the creator, you automatically have admin access to your own application.',
                    ],
                },
            ],
        };

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Get registration tips error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get access request flow guide
// @route   GET /api/docs/format-samples
// @access  Public
exports.getFormatSamples = async (req, res) => {
    try {
        const data = {
            title: 'Requesting Access to an Application',
            intro: 'If you need access to an app registered on DevPortal, here\'s how to request it and what happens next.',
            sections: [
                {
                    heading: 'Step 1 — Browse Available Apps',
                    steps: [
                        'Click "Browse Apps" in the sidebar to see all applications registered on DevPortal.',
                        'Each app listing shows its name, status, and the roles it offers.',
                        'If you already have access to an app, it will show in your Dashboard instead.',
                    ],
                },
                {
                    heading: 'Step 2 — Send an Access Request',
                    steps: [
                        'Click "Request Access" on the app you want to join.',
                        'Select the role you are requesting (e.g. viewer, editor).',
                        'Optionally add a message to explain why you need access.',
                        'Submit your request — the app admin will be notified.',
                    ],
                },
                {
                    heading: 'Step 3 — Wait for Approval',
                    steps: [
                        'Your request status will be visible in your Dashboard as "Pending".',
                        'The application admin reviews all pending requests.',
                        'You will gain or be denied access based on the admin\'s decision.',
                        'Once approved, the app will appear in your Dashboard and you can log into it.',
                    ],
                },
                {
                    heading: 'For App Admins — Reviewing Requests',
                    steps: [
                        'Click "Manage Requests" in the sidebar to see all pending access requests for your apps.',
                        'Review each request — you can see the user\'s name and the role they requested.',
                        'Click "Approve" to grant access or "Deny" to decline.',
                        'Approved users can immediately log in to your application via DevPortal.',
                        'You can revoke access at any time from the Manage Users section of your app.',
                    ],
                },
            ],
        };

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Get access request guide error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get how it works overview
// @route   GET /api/docs/api-reference
// @access  Public
exports.getApiReference = async (req, res) => {
    try {
        const data = {
            title: 'How DevPortal Works',
            intro: 'DevPortal acts as an Identity Provider (IdP). Your users log in through DevPortal and get securely redirected back to your app — without your app ever handling passwords.',
            sections: [
                {
                    heading: 'The Login Flow — What Happens When a User Logs In',
                    steps: [
                        'Your app redirects the user to the DevPortal login page.',
                        'The user signs in with their DevPortal account (or creates one).',
                        'DevPortal checks that the user has access to your app.',
                        'If approved, DevPortal redirects back to your app\'s redirect URI with a short-lived authorization code.',
                        'Your app exchanges that code for an access token, which identifies who the user is and what role they have.',
                        'The access token can be used to personalise the experience and protect parts of your app.',
                    ],
                },
                {
                    heading: 'Session Reuse — What Happens When a User is Already Logged In',
                    steps: [
                        'If a user already has an active DevPortal session, they won\'t see the login form at all.',
                        'DevPortal detects the existing session and immediately generates an authorization code.',
                        'The user is silently redirected back to your app — a seamless Single Sign-On (SSO) experience.',
                        'This means a user who\'s already signed in to one app won\'t have to sign in again to use another app on DevPortal.',
                    ],
                },
                {
                    heading: 'Roles — Controlling What Users Can Do',
                    steps: [
                        'When you register an app, you define the roles available in your system (e.g. admin, viewer, editor).',
                        'When a user requests access, they pick the role they need.',
                        'The app admin approves or denies the request and assigns the role.',
                        'The role is embedded in the user\'s access token, so your app always knows what they\'re allowed to do.',
                        'Admins can change or remove a user\'s access at any time from the Manage Users panel.',
                    ],
                },
                {
                    heading: 'Security — How Your Users Are Protected',
                    steps: [
                        'Passwords are never shared with your app — only a secure access token is passed.',
                        'Tokens are signed and time-limited, so they expire automatically.',
                        'Authorization codes are single-use and expire within 10 minutes.',
                        'The PKCE security standard ensures the login flow cannot be intercepted or replayed.',
                        'All communications happen over HTTPS in production environments.',
                    ],
                },
            ],
        };

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Get how it works error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
