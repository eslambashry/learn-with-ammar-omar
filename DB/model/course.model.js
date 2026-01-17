import { Schema, model, Types } from 'mongoose';

const lessonSchema = new Schema({
    title: { type: String, required: true },
    duration: { type: Number, required: true }, // بالدقائق
    videoId: { type: Types.ObjectId, ref: 'Video' }
});

const chapterSchema = new Schema({
    title: { type: String, required: true },
    lessons: [lessonSchema]
});

const courseSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    instructorId: {
        type: Types.ObjectId,
        ref: 'User',
        required: true
    },
    course_level:{
        type:String
    },
    categoryId: {
        type: Types.ObjectId,
        ref: 'Category'
    },

    price: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'SAR' }
    },

    totalDuration: {
        type: Number, 
        default: 0
    },

    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },

    studentsCount: {
        type: Number,
        default: 0
    },

    chapters: [chapterSchema],

    whatYouWillLearn: [
        { type: String }
    ],

    requirements: [
        { type: String }
    ],

    features: {
        certificate: { type: Boolean, default: false },
        lifetimeAccess: { type: Boolean, default: false },
        downloadableResources: { type: Boolean, default: false },
        practicalApplications: { type: Boolean, default: false },
        mobileAccess: { type: Boolean, default: true }
    },

    bunnyCollectionId: {
        type: String
    },

    image: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true }
    },

    isPublished: {
        type: Boolean,
        default: false
    },

    customId: String

}, { timestamps: true });

export const courseModel = model('Course', courseSchema);
