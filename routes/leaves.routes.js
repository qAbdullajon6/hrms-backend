const express = require("express");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { list, apply, cancel } = require("../controllers/leaves.controller");
const router = express.Router();

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: List leave requests (current user)
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of leave requests }
 */
router.get("/", authenticateToken, list);

/**
 * @swagger
 * /api/leaves:
 *   post:
 *     summary: Apply for leave
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { content: { application/json: { schema: { type: object } } } }
 *     responses:
 *       201: { description: Leave request created }
 */
router.post("/", authenticateToken, apply);

/**
 * @swagger
 * /api/leaves/{id}:
 *   delete:
 *     summary: Cancel leave request
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Cancelled }
 *       404: { description: Not found }
 */
router.delete("/:id", authenticateToken, cancel);

module.exports = router;
