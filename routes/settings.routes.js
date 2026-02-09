const express = require("express");
const { authenticateToken, requireRole } = require("../middlewares/auth.middleware");
const { CAN_MANAGE_SETTINGS } = require("../config/roles");
const { getWorkHours, updateWorkHours } = require("../controllers/settings.controller");

const router = express.Router();

router.get("/work-hours", authenticateToken, getWorkHours);
router.put("/work-hours", authenticateToken, requireRole(CAN_MANAGE_SETTINGS), updateWorkHours);

module.exports = router;
