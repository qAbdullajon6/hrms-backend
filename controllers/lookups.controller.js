const { Department, OfficeLocation } = require("../models/relations");

exports.getDepartments = async (req, res) => {
  try {
    const items = await Department.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });
    return res.status(200).json({ items });
  } catch (error) {
    console.error("getDepartments error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getOfficeLocations = async (req, res) => {
  try {
    const items = await OfficeLocation.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });
    return res.status(200).json({ items });
  } catch (error) {
    console.error("getOfficeLocations error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

