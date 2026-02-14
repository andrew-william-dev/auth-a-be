const mongoose = require('mongoose');
const crypto = require('crypto');

const applicationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide an application name'],
            trim: true,
        },
        redirectUri: {
            type: String,
            required: [true, 'Please provide a redirect URI'],
            trim: true,
        },
        roles: {
            type: [String],
            default: [],
        },
        clientId: {
            type: String,
            unique: true,
        },
        clientSecret: {
            type: String,
            select: false, // Don't return secret by default
        },
        status: {
            type: String,
            enum: ['active', 'pending'],
            default: 'active',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        admins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

// Generate client ID and secret before saving
applicationSchema.pre('save', async function () {
    if (!this.clientId) {
        this.clientId = 'app_' + crypto.randomBytes(16).toString('hex');
    }

    if (!this.clientSecret) {
        this.clientSecret = 'secret_' + crypto.randomBytes(32).toString('hex');
    }
});

module.exports = mongoose.model('Application', applicationSchema);
