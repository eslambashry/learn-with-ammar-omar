import { Schema, model } from 'mongoose';

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        lowercase: true
    },
    image: {
        type: Object,
        default: {} // { secure_url, public_id } from Cloudinary
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export const categoryModel = model('Category', categorySchema);
