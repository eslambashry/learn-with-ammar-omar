import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Student', 'Instructor', 'Admin'],
        default: 'Student'
    },
    // ده الحقل السحري اللي هيمنع تعدد الأجهزة
    currentSessionToken: {
        type: String,
        default: null
    },
    resetVerifyToken: {
        type: String,
        default: null
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    forgetCode:{
        type:String
    },
    image: {
      secure_url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    customId:String

}, { timestamps: true });

export const userModel = model('User', userSchema);
// TODO user videos listen