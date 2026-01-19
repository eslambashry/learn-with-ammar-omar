import { enrollmentModel } from '../../../DB/model/enrollment.model.js';
import { courseModel } from '../../../DB/model/course.model.js';
import { CustomError } from '../../utilities/customError.js';
import { userModel } from '../../../DB/model/user.model.js';
import imagekit from '../../utilities/imagekitConfigration.js';




// Enroll User to Course
export const enrollUser = async (req, res, next) => {
  try {
    const { courseId, userId } = req.body;

    // Check course
    const course = await courseModel.findById(courseId);
    if (!course) return next(new CustomError("Course not found", 404));

    // Check existing enrollment
    const existing = await enrollmentModel.findOne({ userId, courseId });
    if (existing) {
        if (existing.status === 'Rejected') {
            // If rejected, we might allow re-submission or just tell them it's rejected.
            // For now, let's treat it as a new attempt for a rejected one.
            // Or better, return an error saying it's already there and they should talk to admin.
            return next(new CustomError("User already has an enrollment for this course. Status: " + existing.status, 409));
        }
        return next(new CustomError("User already enrolled", 409));
    }

    // Handle image upload
    if (!req.file) {
      return next(new CustomError("Payment receipt (bill image) is required", 400));
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: `bill_${userId}_${courseId}_${Date.now()}`,
      folder: '/enrollments/bills'
    });

    // Create enrollment
    const enrollment = await enrollmentModel.create({
      userId,
      courseId,
      status: 'Pending',
      billImage: {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId
      }
    });

    // NOTE: Atomic updates of counts are removed from here. 
    // They will be performed in approveEnrollment.

    res.status(201).json({
      success: true,
      message: "Enrollment request submitted successfully. Awaiting admin approval.",
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
            .populate('courseId', 'title description thumbnail price image');
        
        res.status(200).json({ success: true, count: enrollments.length, enrollments });
    } catch (error) {
        next(error);
    }
};

// Get Pending Enrollments (Admin)
export const getPendingEnrollments = async (req, res, next) => {
  try {
    const enrollments = await enrollmentModel.find({ status: 'Pending' })
      .populate('userId', 'userName email')
      .populate('courseId', 'title price');

    res.status(200).json({ success: true, count: enrollments.length, enrollments });
  } catch (error) {
    next(error);
  }
};

// Approve Enrollment (Admin)
export const approveEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await enrollmentModel.findById(id);
    if (!enrollment) return next(new CustomError("Enrollment not found", 404));
    if (enrollment.status === 'Active') return next(new CustomError("Enrollment already active", 400));

    // Update status to Active
    enrollment.status = 'Active';
    await enrollment.save();

    // Atomic updates for counts
    await Promise.all([
      userModel.findByIdAndUpdate(
        enrollment.userId,
        { $inc: { coursesCount: 1 } }
      ),
      courseModel.findByIdAndUpdate(
        enrollment.courseId,
        { $inc: { studentsCount: 1 } }
      )
    ]);

    res.status(200).json({
      success: true,
      message: "Enrollment approved and activated successfully.",
      enrollment
    });

  } catch (error) {
    next(error);
  }
};

// Reject Enrollment (Admin)
export const rejectEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await enrollmentModel.findById(id);
    if (!enrollment) return next(new CustomError("Enrollment not found", 404));
    if (enrollment.status !== 'Pending') return next(new CustomError("Can only reject pending enrollments", 400));

    enrollment.status = 'Rejected';
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "Enrollment rejected.",
      enrollment
    });

  } catch (error) {
    next(error);
  }
};
