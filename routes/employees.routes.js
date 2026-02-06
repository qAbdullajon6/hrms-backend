const express = require("express");
const multer = require("multer");
const path = require("path");
const { authenticateToken } = require("../middlewares/auth.middleware");
const {
  createEmployee,
  listEmployees,
  checkEmployeeId,
  inviteEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employees.controller");

const router = express.Router();

// Store uploads under backend/public/files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/files"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * @swagger
 * tags:
 *   - name: Employees
 *     description: Employee create flow (4-step submit at final step)
 */

/**
 * @swagger
 * /api/employees/check-employee-id:
 *   get:
 *     summary: Check employeeId availability (EMP001)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Availability
 *       400:
 *         description: Missing employeeId
 */
router.get("/check-employee-id", authenticateToken, checkEmployeeId);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: List employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Employees list
 */
router.get("/", authenticateToken, listEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee details by id
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Not found
 */
router.get("/:id", authenticateToken, getEmployeeById);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create employee (multipart, final submit)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               personal: { type: string, description: JSON string }
 *               professional: { type: string, description: JSON string }
 *               documents: { type: string, description: JSON string }
 *               accountAccess: { type: string, description: JSON string }
 *               avatarImage: { type: string, format: binary }
 *               appointmentLetter: { type: string, format: binary }
 *               salarySlips:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               relivingLetter:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               experienceLetter:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Created
 *       422:
 *         description: Validation error
 */
router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "avatarImage", maxCount: 1 },
    { name: "appointmentLetter", maxCount: 1 },
    { name: "salarySlips", maxCount: 10 },
    { name: "relivingLetter", maxCount: 10 },
    { name: "experienceLetter", maxCount: 10 },
  ]),
  createEmployee
);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update employee (multipart)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               personal: { type: string, description: JSON string }
 *               professional: { type: string, description: JSON string }
 *               documents: { type: string, description: JSON string }
 *               accountAccess: { type: string, description: JSON string }
 *               avatarImage: { type: string, format: binary }
 *               appointmentLetter: { type: string, format: binary }
 *               salarySlips:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               relivingLetter:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               experienceLetter:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.put(
  "/:id",
  authenticateToken,
  upload.fields([
    { name: "avatarImage", maxCount: 1 },
    { name: "appointmentLetter", maxCount: 1 },
    { name: "salarySlips", maxCount: 10 },
    { name: "relivingLetter", maxCount: 10 },
    { name: "experienceLetter", maxCount: 10 },
  ]),
  updateEmployee
);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", authenticateToken, deleteEmployee);

/**
 * @swagger
 * /api/employees/{id}/invite:
 *   post:
 *     summary: Re-send invite link
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invite sent
 */
router.post("/:id/invite", authenticateToken, inviteEmployee);

module.exports = router;

