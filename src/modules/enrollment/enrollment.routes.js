import { Router } from 'express';
import * as enrollmentController from './enrollment.controller.js';
import { isAdmin, isAuth } from '../../middleware/isAuth.js';
import { multerCloudFunction } from '../../services/multerCloud.js';
import { allowedExtensions } from '../../utilities/allowedExtensions.js';

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
router.post('/', isAuth, multerCloudFunction(allowedExtensions.Image).single('billImage'), enrollmentController.enrollUser);


/**
 * @swagger
 * /api/v1/enrollments/pending:
 *   get:
 *     summary: Get all pending enrollments (Admin)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending enrollments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get('/pending', isAuth, isAdmin, enrollmentController.getPendingEnrollments);

/**
 * @swagger
 * /api/v1/enrollments/{id}/approve:
 *   patch:
 *     summary: Approve an enrollment (Admin)
 *     tags: [Enrollments]
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
 *         description: Enrollment approved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Enrollment not found
 */
router.patch('/:id/approve', isAuth, isAdmin, enrollmentController.approveEnrollment);

/**
 * @swagger
 * /api/v1/enrollments/{id}/reject:
 *   patch:
 *     summary: Reject an enrollment (Admin)
 *     tags: [Enrollments]
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
 *         description: Enrollment rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Enrollment not found
 */
router.patch('/:id/reject', isAuth, isAdmin, enrollmentController.rejectEnrollment);


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
