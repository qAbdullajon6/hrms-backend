const { Op } = require("sequelize");
const { Candidate } = require("../models/relations");
const { resolveAvatarUrl } = require("../utils/avatarUrl");

const baseUrl = () => process.env.API_BASE_URL || process.env.BACKEND_URL || "";

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const search = (req.query.search || "").toString().trim().toLowerCase();
    const offset = (page - 1) * limit;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { appliedFor: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { mobile: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const { count, rows } = await Candidate.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      avatarUrl: resolveAvatarUrl(baseUrl(), r.avatarUrl),
      appliedFor: r.appliedFor,
      appliedDate: r.appliedDate,
      email: r.email,
      mobile: r.mobile || "—",
      status: r.status,
    }));
    return res.status(200).json({
      items,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit) || 1, currentPage: page, itemsPerPage: limit },
    });
  } catch (error) {
    console.error("candidates.list error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, appliedFor, appliedDate, email, mobile, status } = req.body;
    if (!name || !appliedFor || !appliedDate || !email) {
      return res.status(422).json({ message: "name, appliedFor, appliedDate, email are required" });
    }
    const candidate = await Candidate.create({
      name,
      appliedFor,
      appliedDate,
      email,
      mobile: mobile || null,
      status: status || "In Process",
      avatarUrl: req.body.avatarUrl || null,
    });
    return res.status(201).json(candidate);
  } catch (error) {
    console.error("candidates.create error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const c = await Candidate.findByPk(req.params.id);
    if (!c) return res.status(404).json({ message: "Candidate not found" });
    return res.status(200).json(c);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const c = await Candidate.findByPk(req.params.id);
    if (!c) return res.status(404).json({ message: "Candidate not found" });
    const { name, appliedFor, appliedDate, email, mobile, status } = req.body;
    if (name !== undefined) c.name = name;
    if (appliedFor !== undefined) c.appliedFor = appliedFor;
    if (appliedDate !== undefined) c.appliedDate = appliedDate;
    if (email !== undefined) c.email = email;
    if (mobile !== undefined) c.mobile = mobile;
    if (status !== undefined) c.status = status;
    await c.save();
    return res.status(200).json(c);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const n = await Candidate.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ message: "Candidate not found" });
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
