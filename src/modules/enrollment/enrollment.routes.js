import { Router } from 'express';
import * as enrollmentController from './enrollment.controller.js';
import { isAdmin, isAuth } from '../../middleware/isAuth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Course Enrollment Management
 */

/**
 * @swagger
 * /api/v1/enrollments:
 *   post:
 *     summary: Enroll the logged-in user in a course
 *     tags: [Enrollments]
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
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: 65b23f9a12c4d91a8f9c1123
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *       404:
 *         description: Course not found
 *       409:
 *         description: User already enrolled
 *       401:
 *         description: Unauthorized
 */
router.post('/', isAuth, enrollmentController.enrollUser);


/**
 * @swagger
 * /api/v1/enrollments/my-courses:
 *   get:
 *     summary: Get all courses the user is enrolled in
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User enrollments retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-courses', isAuth, enrollmentController.getUserEnrollments);


export default router;
