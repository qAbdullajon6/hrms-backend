const { Op } = require("sequelize");
const { Payroll, Employee } = require("../models/relations");

const baseUrl = () => process.env.API_BASE_URL || process.env.BACKEND_URL || "";

function mapPayrollRow(r) {
  const emp = r.Employee;
  const name = r.name || (emp ? [emp.firstName, emp.lastName].filter(Boolean).join(" ") : null) || "—";
  const avatarUrl = r.avatarUrl
    ? `${baseUrl()}${r.avatarUrl}`
    : emp?.avatarUrl
      ? `${baseUrl()}${emp.avatarUrl}`
      : null;
  return {
    id: r.id,
    employeeId: r.employeeId || emp?.id || null,
    name,
    avatarUrl,
    ctc: r.ctc,
    salaryPerMonth: r.salaryPerMonth,
    deduction: r.deduction || "-",
    status: r.status,
  };
}

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
        { ctc: { [Op.iLike]: `%${search}%` } },
        { salaryPerMonth: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const { count, rows } = await Payroll.findAndCountAll({
      where,
      include: [{ model: Employee, required: false, attributes: ["id", "firstName", "lastName", "avatarUrl"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    const items = rows.map(mapPayrollRow);
    return res.status(200).json({
      items,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit) || 1, currentPage: page, itemsPerPage: limit },
    });
  } catch (error) {
    console.error("payroll.list error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await Payroll.findByPk(id, {
      include: [{ model: Employee, required: false, attributes: ["id", "firstName", "lastName", "avatarUrl"] }],
    });
    if (!row) return res.status(404).json({ message: "Payroll not found" });
    return res.status(200).json(mapPayrollRow(row));
  } catch (error) {
    console.error("payroll.getOne error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { employeeId, name, ctc, salaryPerMonth, deduction, status } = req.body;
    if (!ctc || !salaryPerMonth)
      return res.status(422).json({ message: "ctc and salaryPerMonth are required" });

    let finalName = (name || "").toString().trim();
    let finalAvatarUrl = null;

    if (employeeId) {
      const emp = await Employee.findByPk(employeeId, { attributes: ["id", "firstName", "lastName", "avatarUrl"] });
      if (emp) {
        if (!finalName) finalName = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "—";
        finalAvatarUrl = emp.avatarUrl || null;
      }
    }
    if (!finalName) return res.status(422).json({ message: "name is required or provide a valid employeeId" });

    const payroll = await Payroll.create({
      employeeId: employeeId || null,
      name: finalName,
      avatarUrl: finalAvatarUrl,
      ctc: String(ctc),
      salaryPerMonth: String(salaryPerMonth),
      deduction: deduction != null && deduction !== "" ? String(deduction) : "-",
      status: status === "Completed" ? "Completed" : "Pending",
    });

    const row = await Payroll.findByPk(payroll.id, {
      include: [{ model: Employee, required: false, attributes: ["id", "firstName", "lastName", "avatarUrl"] }],
    });
    return res.status(201).json(mapPayrollRow(row));
  } catch (error) {
    console.error("payroll.create error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, name, ctc, salaryPerMonth, deduction, status } = req.body;

    const row = await Payroll.findByPk(id, {
      include: [{ model: Employee, required: false, attributes: ["id", "firstName", "lastName", "avatarUrl"] }],
    });
    if (!row) return res.status(404).json({ message: "Payroll not found" });

    if (ctc != null) row.ctc = String(ctc);
    if (salaryPerMonth != null) row.salaryPerMonth = String(salaryPerMonth);
    if (deduction !== undefined) row.deduction = deduction !== "" ? String(deduction) : "-";
    if (status === "Completed" || status === "Pending") row.status = status;
    if (name !== undefined) row.name = (name || "").toString().trim() || row.name;

    if (employeeId !== undefined) {
      row.employeeId = employeeId || null;
      if (employeeId) {
        const emp = await Employee.findByPk(employeeId, { attributes: ["id", "firstName", "lastName", "avatarUrl"] });
        if (emp) {
          if (!row.name) row.name = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "—";
          row.avatarUrl = emp.avatarUrl || null;
        }
      } else {
        row.avatarUrl = null;
      }
    }

    await row.save();

    const updated = await Payroll.findByPk(row.id, {
      include: [{ model: Employee, required: false, attributes: ["id", "firstName", "lastName", "avatarUrl"] }],
    });
    return res.status(200).json(mapPayrollRow(updated));
  } catch (error) {
    console.error("payroll.update error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await Payroll.findByPk(id);
    if (!row) return res.status(404).json({ message: "Payroll not found" });
    await row.destroy();
    return res.status(200).json({ message: "Payroll deleted" });
  } catch (error) {
    console.error("payroll.remove error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
