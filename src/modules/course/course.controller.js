import { courseModel } from '../../../DB/model/course.model.js';
import { videoModel } from '../../../DB/model/video.model.js';
import { enrollmentModel } from '../../../DB/model/enrollment.model.js';
import { CustomError } from '../../utilities/customError.js';
import * as bunnyStream from '../../utilities/bunnyStream.js';
import imagekit, { destroyImage } from '../../utilities/imagekitConfigration.js';
import { customAlphabet } from 'nanoid'
import { Types } from 'mongoose';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

// Create a new Course
export const createCourse = async (req, res, next) => {
    try {
        // 1️⃣ Authorization
        if (!['Instructor', 'Admin'].includes(req.user.role)) {
            return next(
                new CustomError(
                    "Not authorized to create course. Only instructors or admins allowed.",
                    403
                )
            );
        }

        // 2️⃣ Extract body
        const {
            title,
            description,
            categoryId,
            priceAmount,
            currency,
            totalDuration,
            whatYouWillLearn,
            requirements,
            features
        } = req.body;

        if (!title) {
            return next(new CustomError("Course title is required", 400));
        }

        // 4️⃣ Create Bunny Collection
        const bunnyCollection = await bunnyStream.createCollection(title);

        // 5️⃣ Upload Image
        let imageData = {};
        let customId;

        if (req.file) {
            customId = nanoid();

            const uploadResult = await imagekit.upload({
                file: req.file.buffer,
                fileName: req.file.originalname,
                folder: `${process.env.PROJECT_FOLDER}/courses/${customId}`,
            });

            imageData = {
                secure_url: uploadResult.url,
                public_id: uploadResult.fileId
            };
        } else {
            return next(new CustomError("Course image is required", 400));
        }

        // 6️⃣ Create Course
        const course = await courseModel.create({
            title,
            slug,
            description,
            instructorId: req.user._id,
            // categoryId,

            price: {
                amount: priceAmount || 0,
                currency: currency || 'SAR'
            },

            totalDuration: totalDuration || 0,

            whatYouWillLearn: whatYouWillLearn
                ? JSON.parse(whatYouWillLearn)
                : [],

            requirements: requirements
                ? JSON.parse(requirements)
                : [],

            features: features
                ? JSON.parse(features)
                : {},

            bunnyCollectionId: bunnyCollection.guid,

            image: imageData,
            categoryId,
            customId,
            isPublished: false
        });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        });
    } catch (error) {
        next(error);
    }
};

// Add Video to Course (Step 1: Create Video Entry in Bunny & DB)
export const addVideo = async (req, res, next) => {
    const {
        courseId,
        title,
        chapterTitle,
        isPreview = false
    } = req.body;
    
    // 1️⃣ Validate Course
    const course = await courseModel.findById(courseId);
    if (!course) {
        return next(new CustomError("Course not found", 404));
    }
    
    // Authorization
    if (
        course.instructorId.toString() !== req.user._id.toString() &&
        req.user.role !== "Admin" && req.user.role !== "Instructor"
    ) {
        return next(
            new CustomError("Not authorized to add videos to this course", 403)
        );
    }
    
    if (!title) {
        return next(new CustomError("Video title is required", 400));
    }
    
    // 2️⃣ Find or Create Chapter
    let chapter = course.chapters.find(
        ch => ch.title === (chapterTitle || "General")
    );
    
    if (!chapter) {
        chapter = {
            _id: new Types.ObjectId(),
            title: chapterTitle || "General",
            lessons: []  // ✅ Changed from videos to lessons
        };
        course.chapters.push(chapter);
    }
    
    // 3️⃣ Create Bunny Video Entry
    const bunnyVideo = await bunnyStream.createVideoEntry(
        title,
        course.bunnyCollectionId
    );
    
    // 4️⃣ Order inside chapter - using lessons array
    const order = (chapter.lessons?.length || 0) + 1;  // ✅ Changed to lessons
    
    // 5️⃣ Create Video Record
    const video = await videoModel.create({
        title,
        courseId,
        chapterId: chapter._id,
        order,
        isPreview,
        status: 'processing',
        bunny: {
            videoId: bunnyVideo.guid,
            libraryId: process.env.BUNNY_LIBRARY_ID
        }
    });
    
    // 6️⃣ Push video into chapter as a lesson
    // You need to create a lesson object with the required fields
    const lesson = {
        title: title,
        duration: 0,  // You'll update this later when video is processed
        videoId: video._id
    };
    
    chapter.lessons.push(lesson);  // ✅ Changed to lessons
    await course.save();
    
    res.status(201).json({
        success: true,
        message: "Video slot created. Ready for upload.",
        video,
        bunnyUploadDetails: bunnyVideo
    });
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
        if (!course) {
            return next(new CustomError("Course not found", 404));
        }

        // Authorization
        if (
            course.instructorId.toString() !== req.user._id.toString() &&
            req.user.role !== "Admin"
        ) {
            return next(new CustomError("Not authorized to update this course", 403));
        }

        const {
            title,
            description,
            priceAmount,
            currency,
            totalDuration,
            whatYouWillLearn,
            requirements,
            features,
            isPublished
        } = req.body;

        // Update title + slug
        if (title) {
            course.title = title;
        }

        if (description) course.description = description;

        // Update price object
        if (priceAmount !== undefined) {
            course.price.amount = priceAmount;
        }
        if (currency) {
            course.price.currency = currency;
        }

        if (totalDuration !== undefined) {
            course.totalDuration = totalDuration;
        }

        // Arrays (form-data safe)
        if (whatYouWillLearn) {
            course.whatYouWillLearn = JSON.parse(whatYouWillLearn);
        }

        if (requirements) {
            course.requirements = JSON.parse(requirements);
        }

        if (features) {
            course.features = JSON.parse(features);
        }

        if (typeof isPublished !== 'undefined') {
            course.isPublished = isPublished;
        }

        // Image update
        if (req.file) {
            if (course.image?.public_id) {
                await destroyImage(course.image.public_id);
            }

            const uploadResult = await imagekit.upload({
                file: req.file.buffer,
                fileName: req.file.originalname,
                folder: `${process.env.PROJECT_FOLDER}/courses/${course.customId}`,
            });

            course.image = {
                secure_url: uploadResult.url,
                public_id: uploadResult.fileId
            };
        }

        await course.save();

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course
        });

    } catch (error) {
        next(error);
    }
};

// Delete Course
export const deleteCourse = async (req, res, next) => {
    try {
        const course = await courseModel.findById(req.params.id);
        if (!course) return next(new CustomError("Course not found", 404));


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

        // const course = await courseModel.findById(video.courseId);
        // if (course.instructorId.toString() !== req.user._id.toString()) {
        //     return next(new CustomError("Not authorized", 403));
        // }

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


export const getAllVideosUrl = async (req, res, next) => {
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


// Users without login
export const showAllCourses = async(req,res,next) =>{
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
}

export const showEachCourse = async(req,res,next)=>{
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
}