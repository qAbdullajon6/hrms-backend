const { Op } = require("sequelize");
const { Attendance, Employee, EmployeeProfessional, Department, EmployeeAccount } = require("../models/relations");
const { getWorkHoursValue } = require("./settings.controller");
const { resolveAvatarUrl } = require("../utils/avatarUrl");

function formatStatus(status) {
  if (status === "present") return "On Time";
  if (status === "late") return "Late";
  if (status === "absent") return "Absent";
  return "On Time";
}

function formatType(employeeType) {
  if (!employeeType) return "Office";
  const t = String(employeeType).toLowerCase();
  return t === "remote" ? "Remote" : "Office";
}

async function getEmployeeIdForUser(userId) {
  const account = await EmployeeAccount.findOne({ where: { userId }, attributes: ["employeeId"] });
  return account?.employeeId || null;
}

function parseTimeToMinutes(str) {
  const [h, m] = String(str).trim().split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isOnTimeOrEarly(now, startTimeStr) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = parseTimeToMinutes(startTimeStr);
  return nowMin <= startMin;
}

function isBeforeWorkEnd(now, endTimeStr) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const endMin = parseTimeToMinutes(endTimeStr);
  return nowMin < endMin;
}

function isNowPastOrAtWorkEnd(now, endTimeStr) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const endMin = parseTimeToMinutes(endTimeStr);
  return nowMin >= endMin;
}

function setTimeOnDate(date, timeStr) {
  const [h, m] = String(timeStr).trim().split(":").map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function getTodayRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today, tomorrow };
}

exports.listAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const search = (req.query.search || "").toString().trim().toLowerCase();
    const offset = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereAttendance = {
      checkIn: { [Op.gte]: today, [Op.lt]: tomorrow },
    };

    const whereEmployee = {};
    const whereProf = {};
    if (search) {
      whereEmployee[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { personalEmail: { [Op.iLike]: `%${search}%` } },
      ];
      whereProf[Op.or] = [
        { employeeIdCode: { [Op.iLike]: `%${search}%` } },
        { workEmail: { [Op.iLike]: `%${search}%` } },
        { designation: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const allTodayAttendance = await Attendance.findAll({
      where: whereAttendance,
      include: [
        {
          model: Employee,
          required: true,
          where: Object.keys(whereEmployee).length ? whereEmployee : undefined,
          include: [
            {
              model: EmployeeProfessional,
              required: true,
              where: Object.keys(whereProf).length ? whereProf : undefined,
              include: [{ model: Department, attributes: ["id", "name"], required: false }],
            },
          ],
        },
      ],
      order: [["checkIn", "DESC"]],
    });

    const presentIds = new Set(allTodayAttendance.map((r) => r.Employee?.id).filter(Boolean));
    const absentWhere = presentIds.size > 0 ? { id: { [Op.notIn]: Array.from(presentIds) } } : {};
    const absentEmployees = await Employee.findAll({
      include: [
        { model: EmployeeAccount, required: true },
        {
          model: EmployeeProfessional,
          required: true,
          include: [{ model: Department, attributes: ["id", "name"], required: false }],
        },
      ],
      ...(Object.keys(absentWhere).length ? { where: absentWhere } : {}),
    });

    const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || "";
    const presentItems = allTodayAttendance.map((rec) => {
      const emp = rec.Employee;
      const prof = emp?.EmployeeProfessional;
      const name = [emp?.firstName, emp?.lastName].filter(Boolean).join(" ") || "—";
      const avatarUrl = resolveAvatarUrl(baseUrl, emp?.avatarUrl);
      return {
        id: rec.id,
        employeeId: emp?.id,
        name,
        email: prof?.workEmail || emp?.personalEmail,
        avatarUrl,
        designation: prof?.designation || "—",
        type: formatType(prof?.employeeType),
        checkInTime: rec.checkIn
          ? new Date(rec.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
          : "—",
        status: formatStatus(rec.status),
      };
    });
    const absentItems = absentEmployees.map((emp) => {
      const prof = emp?.EmployeeProfessional;
      const name = [emp?.firstName, emp?.lastName].filter(Boolean).join(" ") || "—";
      const avatarUrl = resolveAvatarUrl(baseUrl, emp?.avatarUrl);
      return {
        id: `absent-${emp.id}`,
        employeeId: emp?.id,
        name,
        email: prof?.workEmail || emp?.personalEmail,
        avatarUrl,
        designation: prof?.designation || "—",
        type: formatType(prof?.employeeType),
        checkInTime: "—",
        status: "Absent",
      };
    });

    const items = [...presentItems, ...absentItems];
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const paginatedItems = items.slice(offset, offset + limit);

    return res.status(200).json({
      items: paginatedItems,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("listAttendance error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getMyToday = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.userId);
    if (!employeeId) return res.status(403).json({ message: "Employee account not linked to this user" });

    const workHours = await getWorkHoursValue();
    const { today, tomorrow } = getTodayRange();
    const now = new Date();

    let record = await Attendance.findOne({
      where: { employeeId, checkIn: { [Op.gte]: today, [Op.lt]: tomorrow } },
    });

    if (!record && isNowPastOrAtWorkEnd(now, workHours.endTime)) {
      const checkInFake = setTimeOnDate(today, workHours.startTime);
      record = await Attendance.create({
        employeeId,
        checkIn: checkInFake,
        status: "absent",
        workType: "office",
      });
    }

    const formatTime = (d) => (d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : null);
    const isOnBreak = record && record.breakStart && !record.breakEnd;

    return res.status(200).json({
      workHours,
      attendance: record
        ? {
            id: record.id,
            checkIn: record.checkIn,
            checkInTime: formatTime(record.checkIn),
            checkOut: record.checkOut,
            checkOutTime: formatTime(record.checkOut),
            status: record.status,
            breakStart: record.breakStart,
            breakStartTime: formatTime(record.breakStart),
            breakEnd: record.breakEnd,
            breakEndTime: formatTime(record.breakEnd),
            isOnBreak,
          }
        : null,
    });
  } catch (error) {
    console.error("getMyToday error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.userId);
    if (!employeeId) return res.status(403).json({ message: "Employee account not linked to this user" });

    const workHours = await getWorkHoursValue();
    const { today, tomorrow } = getTodayRange();

    const existing = await Attendance.findOne({
      where: { employeeId, checkIn: { [Op.gte]: today, [Op.lt]: tomorrow } },
    });
    if (existing) return res.status(400).json({ message: "Already checked in today" });

    const now = new Date();
    const status = isOnTimeOrEarly(now, workHours.startTime) ? "present" : "late";

    const record = await Attendance.create({
      employeeId,
      checkIn: now,
      status,
      workType: "office",
    });

    const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : null;
    return res.status(201).json({
      attendance: { id: record.id, checkIn: record.checkIn, checkInTime, status: record.status },
      workHours,
    });
  } catch (error) {
    console.error("checkIn error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.userId);
    if (!employeeId) return res.status(403).json({ message: "Employee account not linked to this user" });

    const workHours = await getWorkHoursValue();
    const { today, tomorrow } = getTodayRange();

    const record = await Attendance.findOne({
      where: { employeeId, checkIn: { [Op.gte]: today, [Op.lt]: tomorrow } },
    });
    if (!record) return res.status(400).json({ message: "No check-in found for today" });
    if (record.checkOut) return res.status(400).json({ message: "Already checked out today" });

    const now = new Date();
    const confirmEarly = !!req.body.confirmEarly;
    const beforeEnd = isBeforeWorkEnd(now, workHours.endTime);

    if (!confirmEarly) {
      if (beforeEnd) {
        return res.status(200).json({
          earlyLeaveWarning: true,
          message: "Ish vaqti tugashidan oldin ketmoqchimisiz?",
          workEndTime: workHours.endTime,
        });
      }
      return res.status(200).json({
        confirmEndTime: true,
        message: `Siz ishdan ${workHours.endTime} da ishni tugatdingizmi?`,
        workEndTime: workHours.endTime,
      });
    }

    const customTime = (req.body.checkOutTime || "").toString().trim();
    if (customTime && /^\d{1,2}:\d{2}$/.test(customTime)) {
      const [h, m] = customTime.split(":").map(Number);
      const checkOutDate = new Date(today);
      checkOutDate.setHours(h || 0, m || 0, 0, 0);
      if (checkOutDate >= record.checkIn) record.checkOut = checkOutDate;
      else record.checkOut = now;
    } else {
      record.checkOut = now;
    }
    await record.save();

    const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : null;
    return res.status(200).json({
      attendance: { id: record.id, checkOut: record.checkOut, checkOutTime },
    });
  } catch (error) {
    console.error("checkOut error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.breakStart = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.userId);
    if (!employeeId) return res.status(403).json({ message: "Employee account not linked to this user" });

    const { today, tomorrow } = getTodayRange();
    const record = await Attendance.findOne({
      where: { employeeId, checkIn: { [Op.gte]: today, [Op.lt]: tomorrow } },
    });
    if (!record) return res.status(400).json({ message: "Check in first" });
    if (record.checkOut) return res.status(400).json({ message: "Already checked out" });
    if (record.breakStart && !record.breakEnd) return res.status(400).json({ message: "Already on break" });

    const now = new Date();
    record.breakStart = now;
    await record.save();

    const breakStartTime = new Date(record.breakStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return res.status(200).json({ attendance: { breakStart: record.breakStart, breakStartTime } });
  } catch (error) {
    console.error("breakStart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.breakEnd = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.userId);
    if (!employeeId) return res.status(403).json({ message: "Employee account not linked to this user" });

    const { today, tomorrow } = getTodayRange();
    const record = await Attendance.findOne({
      where: { employeeId, checkIn: { [Op.gte]: today, [Op.lt]: tomorrow } },
    });
    if (!record) return res.status(400).json({ message: "No attendance record" });
    if (!record.breakStart || record.breakEnd) return res.status(400).json({ message: "Not currently on break" });

    const now = new Date();
    record.breakEnd = now;
    await record.save();

    const breakEndTime = new Date(record.breakEnd).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return res.status(200).json({ attendance: { breakEnd: record.breakEnd, breakEndTime } });
  } catch (error) {
    console.error("breakEnd error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getPendingCheckout = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.userId);
    if (!employeeId) return res.status(403).json({ message: "Employee account not linked to this user" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await Attendance.findAll({
      where: {
        employeeId,
        checkOut: null,
        checkIn: { [Op.lt]: today },
      },
      order: [["checkIn", "DESC"]],
      limit: 31,
    });

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-CA") : null);
    const formatTime = (d) => (d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : null);

    const items = records.map((r) => ({
      id: r.id,
      date: formatDate(r.checkIn),
      checkInTime: formatTime(r.checkIn),
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("getPendingCheckout error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.setCheckOut = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.userId);
    if (!employeeId) return res.status(403).json({ message: "Employee account not linked to this user" });

    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ message: "date and time are required (YYYY-MM-DD, HH:mm)" });

    const dateStr = String(date).trim();
    const timeStr = String(time).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    if (!/^\d{1,2}:\d{2}$/.test(timeStr)) return res.status(400).json({ message: "Invalid time format. Use HH:mm" });

    const dayStart = new Date(dateStr + "T00:00:00");
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const record = await Attendance.findOne({
      where: {
        employeeId,
        checkIn: { [Op.gte]: dayStart, [Op.lt]: dayEnd },
        checkOut: null,
      },
    });
    if (!record) return res.status(404).json({ message: "No pending check-out found for this date" });

    const [h, m] = timeStr.split(":").map(Number);
    const checkOutDate = new Date(dayStart);
    checkOutDate.setHours(h || 0, m || 0, 0, 0);
    if (checkOutDate <= record.checkIn) return res.status(400).json({ message: "Check-out time must be after check-in time" });

    record.checkOut = checkOutDate;
    await record.save();

    const checkOutTime = new Date(record.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return res.status(200).json({ attendance: { id: record.id, checkOut: record.checkOut, checkOutTime } });
  } catch (error) {
    console.error("setCheckOut error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
