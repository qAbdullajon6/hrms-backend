const { Op } = require("sequelize");
const { Leave } = require("../models/relations");
const { resolveAvatarUrl } = require("../utils/avatarUrl");

const baseUrl = () => process.env.API_BASE_URL || process.env.BACKEND_URL || "";

function formatShortDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const status = (req.query.status || "").toString().trim();
    const search = (req.query.search || "").toString().trim().toLowerCase();
    const offset = (page - 1) * limit;
    const where = {};
    if (status && ["Pending", "Approved", "Rejected"].includes(status)) where.status = status;
    if (search) where[Op.or] = [{ employeeName: { [Op.iLike]: `%${search}%` } }, { leaveType: { [Op.iLike]: `%${search}%` } }, { manager: { [Op.iLike]: `%${search}%` } }];
    const { count, rows } = await Leave.findAndCountAll({
      where,
      order: [["fromDate", "DESC"]],
      limit,
      offset,
    });
    const items = rows.map((r) => ({
      id: r.id,
      employeeName: r.employeeName,
      avatarUrl: resolveAvatarUrl(baseUrl(), r.avatarUrl),
      leaveType: r.leaveType,
      from: formatShortDate(r.fromDate),
      to: formatShortDate(r.toDate),
      days: r.days,
      manager: r.manager,
      status: r.status,
      reason: r.reason,
    }));
    return res.status(200).json({
      items,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit) || 1, currentPage: page, itemsPerPage: limit },
    });
  } catch (error) {
    console.error("leaves.list error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.apply = async (req, res) => {
  try {
    const { leaveType, from, to, reason, employeeName, manager } = req.body;
    if (!leaveType || !from || !to) return res.status(422).json({ message: "leaveType, from, to are required" });
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    const days = `${diff} Day${diff !== 1 ? "s" : ""}`;
    const leave = await Leave.create({
      employeeName: employeeName || "Current User",
      leaveType,
      fromDate: from,
      toDate: to,
      days,
      manager: manager || "—",
      status: "Pending",
      reason: reason || null,
    });
    return res.status(201).json(leave);
  } catch (error) {
    console.error("leaves.apply error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.cancel = async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "Pending") return res.status(400).json({ message: "Only pending leaves can be cancelled" });
    await leave.destroy();
    return res.status(200).json({ message: "Leave request cancelled" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
