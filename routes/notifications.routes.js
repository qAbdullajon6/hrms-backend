const express = require("express");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { list } = require("../controllers/notifications.controller");
const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List notifications for current user
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of notifications }
 */
router.get("/", authenticateToken, list);

module.exports = router;
