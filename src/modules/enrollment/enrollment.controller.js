import { enrollmentModel } from '../../../DB/model/enrollment.model.js';
import { courseModel } from '../../../DB/model/course.model.js';
import { CustomError } from '../../utilities/customError.js';
import { userModel } from '../../../DB/model/user.model.js';

// Enroll User to Course
export const enrollUser = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // Check course
    const course = await courseModel.findById(courseId);
    if (!course) return next(new CustomError("Course not found", 404));

    // Check existing enrollment
    const existing = await enrollmentModel.findOne({ userId, courseId });
    if (existing) return next(new CustomError("User already enrolled", 409));

    // Create enrollment
    const enrollment = await enrollmentModel.create({
      userId,
      courseId,
      status: 'Active'
    });

    // Atomic updates (IMPORTANT)
    await Promise.all([
      userModel.findByIdAndUpdate(
        userId,
        { $inc: { coursesCount: 1 } }
      ),
      courseModel.findByIdAndUpdate(
        courseId,
        { $inc: { studentsCount: 1 } }
      )
    ]);

    res.status(201).json({
      success: true,
      message: "Enrolled successfully",
      enrollment
    });

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

