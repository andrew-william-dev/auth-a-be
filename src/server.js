require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:5173',
        credentials: true,
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Routes
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const accessRequestRoutes = require('./routes/accessRequests');
const documentationRoutes = require('./routes/documentation');
const oauthRoutes = require('./routes/oauth');

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/docs', documentationRoutes);
app.use('/api/oauth', oauthRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'DevPortal API is running',
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
