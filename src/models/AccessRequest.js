const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
            required: true,
        },
        requestedRole: {
            type: String,
            required: [true, 'Please specify the role you are requesting'],
            trim: true,
        },
        message: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'denied'],
            default: 'pending',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
accessRequestSchema.index({ applicationId: 1, status: 1 });
accessRequestSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
