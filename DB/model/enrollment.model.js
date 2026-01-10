import { Schema, model, Types } from 'mongoose';

const enrollmentSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Refunded', 'Expired'],
        default: 'Active'
    }
}, { timestamps: true });

// Ensure a user can only enroll in a course once
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const enrollmentModel = model('Enrollment', enrollmentSchema);
