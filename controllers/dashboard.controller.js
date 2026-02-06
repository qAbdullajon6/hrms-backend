// controllers/dashboard.controller.js
const { User, Employee, Attendance, Project, EmployeeProfessional } = require("../models/relations");
const { Op } = require("sequelize");

exports.getDashboardStats = async (req, res) => {
  try {
    // Get current date for today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total employees count
    const totalEmployees = await Employee.count();

    // Total applicants (assuming applicants are users who applied but not hired yet)
    // For now, let's count all users as applicants
    const totalApplicants = await User.count();

    // Today's attendance count
    const todayAttendance = await Attendance.count({
      where: {
        checkIn: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Total projects count
    const totalProjects = await Project.count();

    // Calculate changes (comparing with previous period)
    // For now, using static change values, but in real app you'd calculate from previous data
    const stats = {
      totalEmployees: {
        value: totalEmployees,
        change: '+5%',
        trend: 'up'
      },
      totalApplicants: {
        value: totalApplicants,
        change: '+8%',
        trend: 'up'
      },
      todayAttendance: {
        value: todayAttendance,
        change: todayAttendance > 0 ? '+2%' : '0%',
        trend: todayAttendance > 0 ? 'up' : 'neutral'
      },
      totalProjects: {
        value: totalProjects,
        change: '+12%',
        trend: 'up'
      }
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
          attributes: ["firstName", "lastName"],
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

    const formattedRecords = attendanceRecords.map((record) => {
      const firstName = record.Employee?.firstName || "";
      const lastName = record.Employee?.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
      const prof = record.Employee?.EmployeeProfessional;

      return {
        name: fullName,
        designation: prof?.designation || "Unknown",
        type: prof?.employeeType || "Office",
        checkIn: record.checkIn.toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
        }),
        status: record.status,
      };
    });

    res.json(formattedRecords);
  } catch (error) {
    console.error('Recent attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};