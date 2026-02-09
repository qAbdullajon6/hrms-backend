const { Op } = require("sequelize");
const { Job } = require("../models/relations");

exports.list = async (req, res) => {
  try {
    const search = (req.query.search || "").toString().trim().toLowerCase();
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const rows = await Job.findAll({ where, order: [["createdAt", "DESC"]] });
    const active = rows.filter((r) => r.status === "active");
    const inactive = rows.filter((r) => r.status === "inactive");
    const completed = rows.filter((r) => r.status === "completed");
    return res.status(200).json({ active, inactive, completed });
  } catch (error) {
    console.error("jobs.list error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, department, location, amountPerMonth, status, tags, type } = req.body;
    if (!title || !department || !location || !amountPerMonth) {
      return res.status(422).json({ message: "title, department, location, amountPerMonth are required" });
    }
    let tagList = [];
    if (Array.isArray(tags) && tags.length) {
      tagList = tags;
    } else {
      tagList = [
        { label: department },
        { label: type === "wfh" ? "Work from Home" : "Full Time", variant: "secondary" },
      ];
    }
    const amountStr = String(amountPerMonth).includes("/") ? amountPerMonth : `$${amountPerMonth}/Month`;
    const job = await Job.create({
      title,
      department,
      location,
      amountPerMonth: amountStr,
      status: status || "active",
      tags: tagList,
    });
    return res.status(201).json(job);
  } catch (error) {
    console.error("jobs.create error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json(job);
  } catch (error) {
    console.error("jobs.getOne error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, location, amountPerMonth, status, tags } = req.body;
    const job = await Job.findByPk(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (title != null) job.title = title;
    if (department != null) job.department = department;
    if (location != null) job.location = location;
    if (amountPerMonth != null) job.amountPerMonth = String(amountPerMonth).includes("/") ? amountPerMonth : `$${amountPerMonth}/Month`;
    if (status === "active" || status === "inactive" || status === "completed") job.status = status;
    if (Array.isArray(tags)) job.tags = tags;
    await job.save();
    return res.status(200).json(job);
  } catch (error) {
    console.error("jobs.update error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    await job.destroy();
    return res.status(200).json({ message: "Job deleted" });
  } catch (error) {
    console.error("jobs.remove error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
