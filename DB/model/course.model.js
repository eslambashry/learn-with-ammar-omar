import { Schema, model, Types } from 'mongoose';

const courseSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    instructorId: {
        type: Types.ObjectId,
        ref: 'User',
        required: true
    },
    thumbnail: {
        type: Object,
        default: {}
    },
    isPublished: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const courseModel = model('Course', courseSchema);
