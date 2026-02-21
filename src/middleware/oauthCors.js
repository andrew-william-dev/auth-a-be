const cors = require('cors');
const Application = require('../models/Application');

/**
 * Dynamic CORS middleware for public OAuth endpoints.
 *
 * For regular API routes the global CORS middleware allows only the DevPortal
 * frontend origin. However, the OAuth token/authorize endpoints must also be
 * callable from any third-party app whose redirectUri is registered in our DB.
 *
 * This middleware:
 *  1. Extracts the `clientId` from req.body (or req.query for GET requests).
 *  2. Looks up the application and derives the allowed origin from its
 *     registered `redirectUri` (e.g. "https://myapp.com/callback" → "https://myapp.com").
 *  3. Builds an allowed-origins list that includes:
 *       - The DevPortal frontend URL (from env)
 *       - The registered redirectUri origin for this clientId (if found)
 *  4. Runs the standard `cors()` handler with the resolved origin.
 */
const dynamicOAuthCors = async (req, res, next) => {
    // Build the base allowed-origins (always allow the DevPortal frontend)
    const devPortalOrigin =
        process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:5173';

    const allowedOrigins = new Set([devPortalOrigin].filter(Boolean));

    // Pre-flight OPTIONS may not have a body yet; clientId can come from body or query
    const clientId = req.body?.clientId || req.query?.clientId;

    if (clientId) {
        try {
            const application = await Application.findOne({ clientId }).lean();
            if (application?.redirectUri) {
                // Extract just the origin (scheme + host + optional port)
                const { origin } = new URL(application.redirectUri);
                allowedOrigins.add(origin);
            }
        } catch (_) {
            // If DB lookup fails we still continue — worst case the request
            // will be blocked by the cors() handler below.
        }
    }

    return cors({
        origin: (requestOrigin, callback) => {
            // Allow requests with no origin (e.g. Postman, server-to-server)
            if (!requestOrigin) return callback(null, true);

            if (allowedOrigins.has(requestOrigin)) {
                callback(null, true);
            } else {
                console.warn(`[OAuth CORS] Blocked origin: ${requestOrigin}`);
                callback(new Error('CORS: Origin not allowed'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })(req, res, next);
};

module.exports = dynamicOAuthCors;
