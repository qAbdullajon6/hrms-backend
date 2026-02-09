const { Op } = require("sequelize");
const { Department, OfficeLocation, Employee, EmployeeProfessional } = require("../models/relations");
const { resolveAvatarUrl } = require("../utils/avatarUrl");

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

exports.getDepartmentsWithMembers = async (req, res) => {
  try {
    const search = (req.query.search || "").toString().trim().toLowerCase();
    const depts = await Department.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
      include: [
        {
          model: EmployeeProfessional,
          required: false,
          include: [{ model: Employee, required: true, attributes: ["id", "firstName", "lastName", "personalEmail", "avatarUrl"] }],
        },
      ],
    });

    const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || "";
    const items = depts.map((d) => {
      let members = (d.EmployeeProfessionals || []).map((ep) => {
        const emp = ep.Employee;
        const name = [emp?.firstName, emp?.lastName].filter(Boolean).join(" ") || "—";
        return {
          id: emp?.id,
          name,
          role: ep.designation,
          email: ep.workEmail || emp?.personalEmail,
          avatarUrl: resolveAvatarUrl(baseUrl, emp?.avatarUrl),
          employeeId: ep.employeeIdCode,
          employeeType: ep.employeeType || "Office",
          status: "Permanent",
        };
      });
      if (search) {
        const t = search;
        members = members.filter((m) => `${m.name} ${m.role} ${m.employeeId}`.toLowerCase().includes(t));
      }
      const membersCount = members.length;
      const key = d.id;
      return {
        key,
        id: d.id,
        name: d.name,
        membersCount,
        members: members.slice(0, 5),
      };
    });

    const filtered = search ? items.filter((i) => i.name.toLowerCase().includes(search) || i.membersCount > 0) : items;
    return res.status(200).json({ items: filtered });
  } catch (error) {
    console.error("getDepartmentsWithMembers error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const id = req.params.id;
    const d = await Department.findByPk(id, {
      include: [
        {
          model: EmployeeProfessional,
          required: false,
          include: [{ model: Employee, required: true, attributes: ["id", "firstName", "lastName", "personalEmail", "avatarUrl"] }],
        },
      ],
    });
    if (!d) return res.status(404).json({ message: "Department not found" });
    const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || "";
    const members = (d.EmployeeProfessionals || []).map((ep) => {
      const emp = ep.Employee;
      const name = [emp?.firstName, emp?.lastName].filter(Boolean).join(" ") || "—";
      return {
        id: emp?.id,
        name,
        role: ep.designation,
        email: ep.workEmail || emp?.personalEmail,
        avatarUrl: resolveAvatarUrl(baseUrl, emp?.avatarUrl),
        employeeId: ep.employeeIdCode,
        employeeType: ep.employeeType || "Office",
        status: "Permanent",
      };
    });
    return res.status(200).json({
      key: d.id,
      id: d.id,
      name: d.name,
      membersCount: members.length,
      members,
    });
  } catch (error) {
    console.error("getDepartmentById error:", error);
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

