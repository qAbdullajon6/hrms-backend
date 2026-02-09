const express = require("express");
const { authenticateToken } = require("../middlewares/auth.middleware");
const {
  listAttendance,
  getMyToday,
  checkIn,
  checkOut,
  breakStart,
  breakEnd,
  getPendingCheckout,
  setCheckOut,
} = require("../controllers/attendance.controller");

const router = express.Router();

router.get("/me/today", authenticateToken, getMyToday);
router.get("/me/pending-checkout", authenticateToken, getPendingCheckout);
router.post("/me/check-in", authenticateToken, checkIn);
router.post("/me/check-out", authenticateToken, checkOut);
router.post("/me/set-check-out", authenticateToken, setCheckOut);
router.post("/me/break-start", authenticateToken, breakStart);
router.post("/me/break-end", authenticateToken, breakEnd);

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: List attendance records (recent with avatars)
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Attendance list with employeeId, avatarUrl, etc. }
 */
router.get("/", authenticateToken, listAttendance);

module.exports = router;
