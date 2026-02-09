const { Op } = require("sequelize");
const { Holiday } = require("../models/relations");

function getDayName(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
}

exports.list = async (req, res) => {
  try {
    const bucket = (req.query.bucket || "upcoming").toString().toLowerCase();
    const search = (req.query.search || "").toString().trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    const where = {};
    if (bucket === "past") {
      where.date = { [Op.lt]: today };
    } else {
      where.date = { [Op.gte]: today };
    }
    if (search) {
      where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { date: { [Op.iLike]: `%${search}%` } }];
    }
    const rows = await Holiday.findAll({ where, order: [["date", "ASC"]] });
    const items = rows.map((r) => ({
      id: r.id,
      dateLabel: formatDateLabel(r.date),
      day: getDayName(r.date),
      name: r.name,
      bucket: bucket === "past" ? "past" : "upcoming",
    }));
    return res.status(200).json(items);
  } catch (error) {
    console.error("holidays.list error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, date } = req.body;
    if (!name || !date) return res.status(422).json({ message: "name and date are required" });
    const holiday = await Holiday.create({ name, date });
    return res.status(201).json({
      id: holiday.id,
      dateLabel: formatDateLabel(holiday.date),
      day: getDayName(holiday.date),
      name: holiday.name,
      bucket: new Date(holiday.date) >= new Date() ? "upcoming" : "past",
    });
  } catch (error) {
    console.error("holidays.create error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
