// routes/dashboard.routes.js
const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAttendanceOverview,
  getRecentAttendance,
  getSchedule,
} = require("../controllers/dashboard.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEmployees:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: integer
 *                     change:
 *                       type: string
 *                     trend:
 *                       type: string
 *                 totalApplicants:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: integer
 *                     change:
 *                       type: string
 *                     trend:
 *                       type: string
 *                 todayAttendance:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: integer
 *                     change:
 *                       type: string
 *                     trend:
 *                       type: string
 *                 totalProjects:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: integer
 *                     change:
 *                       type: string
 *                     trend:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticateToken, getDashboardStats);

/**
 * @swagger
 * /api/dashboard/attendance-overview:
 *   get:
 *     summary: Get attendance overview for the week
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   day:
 *                     type: string
 *                   present:
 *                     type: integer
 *                   late:
 *                     type: integer
 *                   absent:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/attendance-overview', authenticateToken, getAttendanceOverview);

/**
 * @swagger
 * /api/dashboard/recent-attendance:
 *   get:
 *     summary: Get recent attendance records
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   designation:
 *                     type: string
 *                   type:
 *                     type: string
 *                   checkIn:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/recent-attendance', authenticateToken, getRecentAttendance);

router.get('/schedule', authenticateToken, getSchedule);

module.exports = router;