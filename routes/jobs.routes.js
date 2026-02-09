const express = require("express");
const { authenticateToken, requireRole } = require("../middlewares/auth.middleware");
const { CAN_MANAGE_JOBS } = require("../config/roles");
const { list, create, getOne, update, remove } = require("../controllers/jobs.controller");
const router = express.Router();

router.get("/", authenticateToken, list);
router.get("/:id", authenticateToken, getOne);
router.post("/", authenticateToken, requireRole(CAN_MANAGE_JOBS), create);
router.put("/:id", authenticateToken, requireRole(CAN_MANAGE_JOBS), update);
router.delete("/:id", authenticateToken, requireRole(CAN_MANAGE_JOBS), remove);

module.exports = router;
