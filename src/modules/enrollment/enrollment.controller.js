import { enrollmentModel } from '../../../DB/model/enrollment.model.js';
import { courseModel } from '../../../DB/model/course.model.js';
import { CustomError } from '../../utilities/customError.js';

// Enroll User to Course
export const enrollUser = async (req, res, next) => {
    try {
        const { courseId } = req.body;
        const userId = req.user._id;

        // Check if course exists
        const course = await courseModel.findById(courseId);
        if (!course) return next(new CustomError("Course not found", 404));

        // Check if already enrolled
        const existing = await enrollmentModel.findOne({ userId, courseId });
        if (existing) return next(new CustomError("User already enrolled", 409));

        // Create Enrollment
        const enrollment = await enrollmentModel.create({
            userId,
            courseId,
            status: 'Active',
            enrolledAt: Date.now()
        });

        res.status(201).json({ success: true, message: "Enrolled successfully", enrollment });
    } catch (error) {
        next(error);
    }
};

// Get User's Enrollments
export const getUserEnrollments = async (req, res, next) => {
    try {
        const enrollments = await enrollmentModel.find({ userId: req.user._id })
            .populate('courseId', 'title description thumbnail price');
        
        res.status(200).json({ success: true, count: enrollments.length, enrollments });
    } catch (error) {
        next(error);
    }
};
