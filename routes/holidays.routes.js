const express = require("express");
const { authenticateToken, requireRole } = require("../middlewares/auth.middleware");
const { CAN_MANAGE_HOLIDAYS } = require("../config/roles");
const { list, create } = require("../controllers/holidays.controller");
const router = express.Router();

/**
 * @swagger
 * /api/holidays:
 *   get:
 *     summary: List holidays
 *     tags: [Holidays]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of holidays }
 */
router.get("/", authenticateToken, list);

/**
 * @swagger
 * /api/holidays:
 *   post:
 *     summary: Create holiday (HR/Admin only)
 *     tags: [Holidays]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { content: { application/json: { schema: { type: object } } } }
 *     responses:
 *       201: { description: Created }
 *       403: { description: Access denied }
 */
router.post("/", authenticateToken, requireRole(CAN_MANAGE_HOLIDAYS), create);

module.exports = router;
