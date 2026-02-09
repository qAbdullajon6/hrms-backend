// controllers/dashboard.controller.js
const { User, Employee, Attendance, Project, EmployeeProfessional, ScheduleEvent, Candidate } = require("../models/relations");
const { Op } = require("sequelize");
const { resolveAvatarUrl } = require("../utils/avatarUrl");

function formatAddedToday(count) {
  if (count === 0) return { change: '0 today', trend: 'neutral' };
  return { change: `+${count} today`, trend: 'up' };
}

function formatChangePercent(previous, current) {
  if (previous === 0) return { change: current > 0 ? '+100%' : '0%', trend: current > 0 ? 'up' : 'neutral' };
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct >= 0 ? '+' : '';
  return { change: `${sign}${pct}%`, trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral' };
}

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Total employees: value = total, change = how many added today
    const totalEmployees = await Employee.count();
    const employeesAddedToday = await Employee.count({
      where: { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } }
    });
    const employeesChange = formatAddedToday(employeesAddedToday);

    // Total applicants (Candidates): value = total, change = how many added today
    const totalApplicants = await Candidate.count();
    const applicantsAddedToday = await Candidate.count({
      where: { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } }
    });
    const applicantsChange = formatAddedToday(applicantsAddedToday);

    // Today's attendance: value = today count, change = % vs yesterday
    const todayAttendance = await Attendance.count({
      where: {
        checkIn: { [Op.gte]: today, [Op.lt]: tomorrow }
      }
    });
    const yesterdayAttendance = await Attendance.count({
      where: {
        checkIn: { [Op.gte]: yesterday, [Op.lt]: today }
      }
    });
    const attendanceChange = formatChangePercent(yesterdayAttendance, todayAttendance);

    // Total projects: value = total, change = how many added today
    const totalProjects = await Project.count();
    const projectsAddedToday = await Project.count({
      where: { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } }
    });
    const projectsChange = formatAddedToday(projectsAddedToday);

    const stats = {
      totalEmployees: {
        value: totalEmployees,
        change: employeesChange.change,
        trend: employeesChange.trend
      },
      totalApplicants: {
        value: totalApplicants,
        change: applicantsChange.change,
        trend: applicantsChange.trend
      },
      todayAttendance: {
        value: todayAttendance,
        change: attendanceChange.change,
        trend: attendanceChange.trend
      },
      totalProjects: {
        value: totalProjects,
        change: projectsChange.change,
        trend: projectsChange.trend
      },
      lastUpdated: now.toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAttendanceOverview = async (req, res) => {
  try {
    // Get attendance data for the current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const attendanceData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      // Count attendance for this day
      const present = await Attendance.count({
        where: {
          checkIn: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          },
          status: 'present'
        }
      });

      const late = await Attendance.count({
        where: {
          checkIn: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          },
          status: 'late'
        }
      });

      const absent = await Attendance.count({
        where: {
          checkIn: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          },
          status: 'absent'
        }
      });

      const total = present + late + absent;

      attendanceData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        present: total > 0 ? Math.round((present / total) * 100) : 0,
        late: total > 0 ? Math.round((late / total) * 100) : 0,
        absent: total > 0 ? Math.round((absent / total) * 100) : 0
      });
    }

    res.json(attendanceData);
  } catch (error) {
    console.error('Attendance overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRecentAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's attendance records with employee details
    const attendanceRecords = await Attendance.findAll({
      where: {
        checkIn: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      include: [
        {
          model: Employee,
          attributes: ["id", "firstName", "lastName", "avatarUrl"],
          include: [
            {
              model: EmployeeProfessional,
              attributes: ["designation", "employeeType"],
              required: false,
            },
          ],
        },
      ],
      order: [['checkIn', 'ASC']],
      limit: 10
    });

    const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || "";
    const formattedRecords = attendanceRecords.map((record) => {
      const firstName = record.Employee?.firstName || "";
      const lastName = record.Employee?.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
      const prof = record.Employee?.EmployeeProfessional;
      const statusDisplay = record.status === "late" ? "Late" : "On Time";
      const avatarUrl = resolveAvatarUrl(baseUrl, record.Employee?.avatarUrl);
      return {
        employeeId: record.Employee?.id || null,
        name: fullName,
        avatarUrl,
        designation: prof?.designation || "Unknown",
        type: prof?.employeeType || "Office",
        checkIn: record.checkIn.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        status: statusDisplay,
      };
    });

    res.json(formattedRecords);
  } catch (error) {
    console.error('Recent attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (Number.isNaN(month) || Number.isNaN(year) || month < 0 || month > 11) {
      return res.status(400).json({ message: 'month (0-11) and year are required' });
    }
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const events = await ScheduleEvent.findAll({
      where: {
        eventDate: {
          [Op.gte]: startStr,
          [Op.lte]: endStr,
        },
      },
      order: [['eventDate', 'ASC'], ['time', 'ASC']],
    });

    const datesWithEvents = [];
    const eventsByDate = {};
    for (const e of events) {
      const d = e.eventDate;
      const day = new Date(d).getDate();
      if (!datesWithEvents.includes(day)) datesWithEvents.push(day);
      if (!eventsByDate[d]) eventsByDate[d] = [];
      eventsByDate[d].push({
        time: e.time,
        title: e.title,
        subtitle: e.subtitle || null,
      });
    }
    datesWithEvents.sort((a, b) => a - b);

    res.json({
      datesWithEvents,
      eventsByDate,
      eventsList: Object.entries(eventsByDate).map(([date, evs]) => ({
        date,
        dateLabel: new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        events: evs,
      })).sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error('getSchedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};