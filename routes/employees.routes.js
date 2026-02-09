const express = require("express");
const multer = require("multer");
const path = require("path");
const { authenticateToken, requireRole } = require("../middlewares/auth.middleware");
const { CAN_MANAGE_EMPLOYEES } = require("../config/roles");
const {
  createEmployee,
  listEmployees,
  checkEmployeeId,
  inviteEmployee,
  getEmployeeById,
  getEmployeeAttendance,
  getEmployeeLeaves,
  getEmployeeProjects,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employees.controller");

const router = express.Router();

// Fayl nomini xavfsiz qilish (path va maxsus belgilarni olib tashlash)
function sanitizeFileName(name) {
  if (!name || typeof name !== "string") return "document";
  const base = path.basename(name);
  const ext = path.extname(base);
  const nameWithoutExt = base.slice(0, base.length - ext.length) || "document";
  const safe = nameWithoutExt.replace(/[^a-zA-Z0-9_\-\s\.]/g, "_").replace(/\s+/g, "_").slice(0, 120);
  return (safe || "document") + ext;
}

// Store uploads under backend/public/files — original nomi bilan (timestamp bilan yagona qilish)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/files"));
  },
  filename: (req, file, cb) => {
    const original = sanitizeFileName(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}_${original}`;
    cb(null, unique);
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
 *       - in: query
 *         name: departmentIds
 *         schema: { type: string, description: "Comma-separated department UUIDs" }
 *       - in: query
 *         name: workMode
 *         schema: { type: string, enum: [office, remote] }
 *       - in: query
 *         name: roles
 *         schema: { type: string, description: "Comma-separated roles: admin,hr,manager,designer,developer,employee" }
 *     responses:
 *       200:
 *         description: Employees list
 */
router.get("/", authenticateToken, listEmployees);

/**
 * @swagger
 * /api/employees/{id}/attendance:
 *   get:
 *     summary: Get attendance records for an employee
 *     tags: [Employees]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: List of attendance rows }
 *       404: { description: Employee not found }
 */
router.get("/:id/attendance", authenticateToken, getEmployeeAttendance);

/**
 * @swagger
 * /api/employees/{id}/leaves:
 *   get:
 *     summary: Get leave requests for an employee
 *     tags: [Employees]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: List of leave rows }
 *       404: { description: Employee not found }
 */
router.get("/:id/leaves", authenticateToken, getEmployeeLeaves);

/**
 * @swagger
 * /api/employees/{id}/projects:
 *   get:
 *     summary: Get projects managed by an employee
 *     tags: [Employees]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: List of project rows }
 *       404: { description: Employee not found }
 */
router.get("/:id/projects", authenticateToken, getEmployeeProjects);

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
 *               accountAccess: { type: string, description: "JSON: loginEmail, role (admin|hr|manager|designer|developer|employee), slackId?, skypeId?, githubId?" }
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
  requireRole(CAN_MANAGE_EMPLOYEES),
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
 *               accountAccess: { type: string, description: "JSON: loginEmail, role (admin|hr|manager|designer|developer|employee), slackId?, skypeId?, githubId?" }
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
  requireRole(CAN_MANAGE_EMPLOYEES),
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
 *         description: Deleted (linked User removed)
 *       403:
 *         description: Access denied (admin/hr only)
 *       404:
 *         description: Not found
 */
router.delete("/:id", authenticateToken, requireRole(CAN_MANAGE_EMPLOYEES), deleteEmployee);

/**
 * @swagger
 * /api/employees/{id}/invite:
 *   post:
 *     summary: Send invite (set-password link) to employee
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
 *       403:
 *         description: Access denied (admin/hr only)
 */
router.post("/:id/invite", authenticateToken, requireRole(CAN_MANAGE_EMPLOYEES), inviteEmployee);

module.exports = router;

