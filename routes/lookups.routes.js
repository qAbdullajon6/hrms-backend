const express = require("express");
const { authenticateToken } = require("../middlewares/auth.middleware");
const {
  getDepartments,
  getDepartmentsWithMembers,
  getDepartmentById,
  getOfficeLocations,
} = require("../controllers/lookups.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Lookups
 *     description: Lookup lists (departments, office locations, etc.)
 */

/**
 * @swagger
 * /api/lookups/departments:
 *   get:
 *     summary: Get active departments
 *     tags: [Lookups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       isActive: { type: boolean }
 */
router.get("/departments", authenticateToken, getDepartments);
router.get("/departments/with-members", authenticateToken, getDepartmentsWithMembers);
router.get("/departments/:id", authenticateToken, getDepartmentById);

/**
 * @swagger
 * /api/lookups/office-locations:
 *   get:
 *     summary: Get active office locations
 *     tags: [Lookups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Office location list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       isActive: { type: boolean }
 */
router.get("/office-locations", authenticateToken, getOfficeLocations);

module.exports = router;

