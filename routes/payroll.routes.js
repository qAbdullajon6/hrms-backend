const express = require("express");
const { authenticateToken, requireRole } = require("../middlewares/auth.middleware");
const { CAN_MANAGE_PAYROLL } = require("../config/roles");
const { list, getOne, create, update, remove } = require("../controllers/payroll.controller");
const router = express.Router();

router.get("/", authenticateToken, list);
router.get("/:id", authenticateToken, getOne);
router.post("/", authenticateToken, requireRole(CAN_MANAGE_PAYROLL), create);
router.put("/:id", authenticateToken, requireRole(CAN_MANAGE_PAYROLL), update);
router.delete("/:id", authenticateToken, requireRole(CAN_MANAGE_PAYROLL), remove);

module.exports = router;
