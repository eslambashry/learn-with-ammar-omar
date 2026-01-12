import { Router } from 'express';
import * as courseController from './course.controller.js';
import { isAuth } from '../../middleware/isAuth.js';
import { allowedExtensions } from '../../utilities/allowedExtensions.js';
import { multerCloudFunction } from '../../services/multerCloud.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course & Video Management
 */

/**
 * @swagger
 * /api/v1/courses/create:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Course created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/create', isAuth,multerCloudFunction(allowedExtensions.Image).single('image'), courseController.createCourse);


/**
 * @swagger
 * /api/v1/courses/{id}:
 *   get:
 *     summary: Get one course with its videos
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/:id', isAuth, courseController.getCourse);


/**
 * @swagger
 * /api/v1/courses/{id}:
 *   put:
 *     summary: Update a course (Instructor only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       403:
 *         description: Not authorized
 */
router.put('/:id', isAuth, courseController.updateCourse);


/**
 * @swagger
 * /api/v1/courses/{id}:
 *   delete:
 *     summary: Delete a course and its videos (Instructor only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course and videos deleted
 *       403:
 *         description: Not authorized
 */
router.delete('/:id', isAuth, courseController.deleteCourse);


/**
 * @swagger
 * /api/v1/courses/video/add:
 *   post:
 *     summary: Add a video to a course (Create Bunny video entry)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - title
 *             properties:
 *               courseId:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Video slot created successfully
 *       403:
 *         description: Not authorized
 */
router.post('/video/add', isAuth, courseController.addVideo);


/**
 * @swagger
 * /api/v1/courses/video/{videoId}:
 *   delete:
 *     summary: Delete a video (Instructor only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       403:
 *         description: Not authorized
 */
router.delete('/video/:videoId', isAuth, courseController.deleteVideo);


/**
 * @swagger
 * /api/v1/courses/video/{videoId}/sign:
 *   get:
 *     summary: Get signed URL for secure video playback
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
 *       403:
 *         description: User must be enrolled to watch this video
 *       404:
 *         description: Video not found
 */
router.get('/video/:videoId/sign', isAuth, courseController.getVideoUrl);

export default router;
