import { Schema, model, Types } from 'mongoose';

const courseSchema = new Schema({
    title: { type: String, required: true },
    bunnyCollectionId: { type: String }, // Folder ID on Bunny
    chapters: [{
        title: { type: String, required: true }, // مقدمة، الشابتر الأول، الخ
        videos: [{ type: Schema.Types.ObjectId, ref: 'Video' }]
    }],
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
    },
    image:{
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true }
    },
    customId:String
},{ timestamps: true });

export const courseModel = model('Course', courseSchema);

