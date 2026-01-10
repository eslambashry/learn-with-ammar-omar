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
        required: true
    },
    bunnyVideoId: { 
        type: String,
        required: true,
        trim: true,
        description: "The unique Video ID from Bunny.net"
    },
    order: {
        type: Number,
        required: true,
        default: 1
    },
    isPreview: {
        type: Boolean,
        default: false,
        description: "If true, this video can be watched without enrollment"
    },
    duration: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const videoModel = model('Video', videoSchema);
