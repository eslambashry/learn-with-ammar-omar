import { Schema, model, Types } from 'mongoose';

const videoSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    courseId: {
        type: Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },

    chapterId: {
        type: Types.ObjectId,
        required: true // reference logical chapter (مش collection)
    },

    bunny: {
        videoId: {
            type: String,
            required: true
        },
        libraryId: {
            type: String,
            required: true
        }
    },

    duration: {
        type: Number,
        default: 0 // seconds
    },

    order: {
        type: Number,
        default: 1
    },

    isPreview: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: ['processing', 'ready', 'failed'],
        default: 'processing'
    }

}, { timestamps: true });

export const videoModel = model('Video', videoSchema);