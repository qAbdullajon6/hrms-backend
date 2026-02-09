const express = require("express");
const { authenticateToken, requireRole } = require("../middlewares/auth.middleware");
const { CAN_MANAGE_CANDIDATES } = require("../config/roles");
const { list, create, getById, update, remove } = require("../controllers/candidates.controller");
const router = express.Router();

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: List candidates
 *     tags: [Candidates]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated candidates list }
 */
router.get("/", authenticateToken, list);

/**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Create candidate (HR/Admin only)
 *     tags: [Candidates]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { content: { application/json: { schema: { type: object } } } }
 *     responses:
 *       201: { description: Created }
 *       403: { description: Access denied }
 */
router.post("/", authenticateToken, requireRole(CAN_MANAGE_CANDIDATES), create);

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get candidate by id
 *     tags: [Candidates]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Candidate details }
 *       404: { description: Not found }
 */
router.get("/:id", authenticateToken, getById);

/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update candidate (HR/Admin only)
 *     tags: [Candidates]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Access denied }
 */
router.put("/:id", authenticateToken, requireRole(CAN_MANAGE_CANDIDATES), update);

/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete candidate (HR/Admin only)
 *     tags: [Candidates]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Deleted }
 *       403: { description: Access denied }
 */
router.delete("/:id", authenticateToken, requireRole(CAN_MANAGE_CANDIDATES), remove);

module.exports = router;
