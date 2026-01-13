import { courseModel } from '../../../DB/model/course.model.js';
import { videoModel } from '../../../DB/model/video.model.js';
import { enrollmentModel } from '../../../DB/model/enrollment.model.js';
import { CustomError } from '../../utilities/customError.js';
import * as bunnyStream from '../../utilities/bunnyStream.js';
import imagekit from '../../utilities/imagekitConfigration.js';
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

// Create a new Course
export const createCourse = async (req, res, next) => {
    try {
        const { title, description, price } = req.body;
        
        // Instructor is the logged-in user
        if(req.user.role != "Instructor"){
            return next(new CustomError("Not authorized to create course only Instructor can", 403));
        }
        // 1. إنشاء Folder (Collection) في باني باسم الكورس
        const bunnyCollection = await bunnyStream.createCollection(title);

        const instructorId = req.user._id;

        let uploadResult 

        if (req.file) {
            // Upload image to ImageKit
        const customId = nanoid();

             uploadResult = await imagekit.upload({
              file: req.file.buffer,
              fileName: req.file.originalname,
              folder: `${process.env.PROJECT_FOLDER}/Course/${customId}`,
            });
          }
        const course = await courseModel.create({
            title,
            description,
            price,
            instructorId,
            bunnyCollectionId: bunnyCollection.guid, // حفظ الـ Folder ID
            image: {
                secure_url: uploadResult.url, 
                public_id: uploadResult.fileId,
            },        
    });

        res.status(201).json({ success: true, message: "Course created successfully", course });
    } catch (error) {
        next(error);
    }
};

// Add Video to Course (Step 1: Create Video Entry in Bunny & DB)
export const addVideo = async (req, res, next) => {
    try {
        const { courseId, title ,chapterTitle} = req.body;

        // Verify Course Exists & Ownership
        const course = await courseModel.findById(courseId);
        if (!course) return next(new CustomError("Course not found", 404));
        if (course.instructorId.toString() !== req.user._id.toString()) {
            return next(new CustomError("Not authorized to add videos to this course", 403));
        }
        
        // 1. Create Video Placeholder in Bunny.net
        const bunnyVideo = await bunnyStream.createVideoEntry(title,course.bunnyCollectionId);
        
        // 2. Save Metadata to DB
        const count = await videoModel.countDocuments({ courseId });
        const video = await videoModel.create({
            title,
            courseId,
            bunnyVideoId: bunnyVideo.guid,
            order: count + 1
        });
        
        // Find if chapter already exists
        const chapterIndex = course.chapters.findIndex(ch => ch.title === chapterTitle);
        
        if (chapterIndex !== -1) {
            // Add to existing chapter
            course.chapters[chapterIndex].videos.push(video._id);
        } else {
            // Create new chapter and add video
            course.chapters.push({
                title: chapterTitle || "General", // Default to General if no title provided
                videos: [video._id]
            });
        }

        res.status(201).json({ 
            success: true, 
            message: "Video slot created. Ready for upload.", 
            video,
            bunnyUploadDetails: bunnyVideo // Contains presigned upload info from Bunny
        });
    } catch (error) {
        next(error);
    }
};

// Get One Course (Public + Videos list without secure links)
export const getCourse = async (req, res, next) => {
    try {
        const course = await courseModel.findById(req.params.id).populate('instructorId', 'userName');
        if (!course) return next(new CustomError("Course not found", 404));

        const videos = await videoModel.find({ courseId: course._id }).sort({ order: 1 });

        // Hide bunnyVideoId from public response if you want extra security, 
        // but here we might need it for identifying which video to play.
        // Let's keep it but remember the actual playback link comes from /sign endpoint.
        
        res.status(200).json({ success: true, course, videos });
    } catch (error) {
        next(error);
    }
};


// Update Course
export const updateCourse = async (req, res, next) => {
    try {
        const course = await courseModel.findById(req.params.id);
        if (!course) return next(new CustomError("Course not found", 404));
        
        if (course.instructorId.toString() !== req.user._id.toString()) {
            return next(new CustomError("Not authorized", 403));
        }

        const updated = await courseModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, course: updated });
    } catch (error) {
        next(error);
    }
};

// Delete Course
export const deleteCourse = async (req, res, next) => {
    try {
        const course = await courseModel.findById(req.params.id);
        if (!course) return next(new CustomError("Course not found", 404));

        if (course.instructorId.toString() !== req.user._id.toString()) {
            return next(new CustomError("Not authorized", 403));
        }

        // TODO: Delete all video entries from Bunny first?
        // This can be heavy. Ideally, background job. For now, simple DB delete.
        // Or loop and delete videos:
        const videos = await videoModel.find({ courseId: course._id });
        for (const video of videos) {
            try {
                await bunnyStream.deleteVideoEntry(video.bunnyVideoId);
            } catch (e) {
                console.log(`Failed to delete bunny video ${video.bunnyVideoId}`, e.message);
            }
        }
        await videoModel.deleteMany({ courseId: course._id });
        await courseModel.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: "Course and videos deleted" });
    } catch (error) {
        next(error);
    }
};

// Delete Video
export const deleteVideo = async (req, res, next) => {
    try {
        const video = await videoModel.findById(req.params.videoId);
        if (!video) return next(new CustomError("Video not found", 404));

        const course = await courseModel.findById(video.courseId);
        if (course.instructorId.toString() !== req.user._id.toString()) {
            return next(new CustomError("Not authorized", 403));
        }

        // Delete from Bunny
        await bunnyStream.deleteVideoEntry(video.bunnyVideoId);
        
        // Delete from DB
        await videoModel.findByIdAndDelete(req.params.videoId);

        res.status(200).json({ success: true, message: "Video deleted" });
    } catch (error) {
        next(error);
    }
};

// Get Signed URL for a Video (Secure Playback)
export const getVideoUrl = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        
        const video = await videoModel.findById(videoId);
        if (!video) return next(new CustomError("Video not found", 404));

        const course = await courseModel.findById(video.courseId);
        
        // Security Check: Is Instructor (Owner) OR Is Enrolled Student?
        const isOwner = course.instructorId.toString() === req.user._id.toString();
        
        if (!isOwner) {
            // Check Enrollment
            const enrollment = await enrollmentModel.findOne({
                userId: req.user._id,
                courseId: video.courseId,
                status: 'Active'
            });

            if (!enrollment && !video.isPreview) {
                return next(new CustomError("You must be enrolled to watch this video", 403));
            }
        }
        
        // Generate Signed Token
        const signedData = bunnyStream.generateSignedUrl(video.bunnyVideoId);

        res.status(200).json({
            success: true,
            signedUrlParams: signedData
        });
    } catch (error) {
        next(error);
    }
};


export const getAllCourses = async (req, res, next) => {
    try {
        const courses = await courseModel.find().populate('instructorId','userName image')
        if (!courses) return next(new CustomError("Course not found", 404));

        // Hide bunnyVideoId from public response if you want extra security, 
        // but here we might need it for identifying which video to play.
        // Let's keep it but remember the actual playback link comes from /sign endpoint.
        
        res.status(200).json({ success: true, courses});
    } catch (error) {
        next(error);
    }
};