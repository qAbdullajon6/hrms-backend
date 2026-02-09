"use strict";

const { v4: uuidv4 } = require("uuid");
const {
  Department,
  OfficeLocation,
  Employee,
  EmployeeProfessional,
  EmployeeDocuments,
  EmployeeAccount,
  Attendance,
  Candidate,
  Holiday,
  Job,
  Leave,
  Notification,
  Payroll,
  ScheduleEvent,
  User,
} = require("../models/relations");
const { hashedPassword } = require("../utils/hash");

const WORKING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function avatarUrl(gender, index) {
  const n = (index % 99) + 1;
  const folder = gender === "Female" ? "women" : "men";
  return `https://randomuser.me/api/portraits/${folder}/${n}.jpg`;
}

const EMPLOYEES_DATA = [
  { firstName: "Sarah", lastName: "Connor", gender: "Female", department: "IT", location: "Head Office", designation: "Senior Developer", type: "Office" },
  { firstName: "John", lastName: "Smith", gender: "Male", department: "IT", location: "Remote", designation: "Backend Developer", type: "Remote" },
  { firstName: "Emma", lastName: "Wilson", gender: "Female", department: "HR", location: "Head Office", designation: "HR Manager", type: "Office" },
  { firstName: "Michael", lastName: "Brown", gender: "Male", department: "Finance", location: "Branch Office", designation: "Accountant", type: "Office" },
  { firstName: "Olivia", lastName: "Davis", gender: "Female", department: "Marketing", location: "Head Office", designation: "Marketing Lead", type: "Office" },
  { firstName: "James", lastName: "Taylor", gender: "Male", department: "Sales", location: "Remote", designation: "Sales Executive", type: "Remote" },
  { firstName: "Sophia", lastName: "Martinez", gender: "Female", department: "IT", location: "Head Office", designation: "UI/UX Designer", type: "Office" },
  { firstName: "William", lastName: "Anderson", gender: "Male", department: "Finance", location: "Head Office", designation: "Finance Analyst", type: "Office" },
  { firstName: "Isabella", lastName: "Thomas", gender: "Female", department: "HR", location: "Branch Office", designation: "Recruiter", type: "Office" },
  { firstName: "Benjamin", lastName: "Jackson", gender: "Male", department: "Sales", location: "Head Office", designation: "Sales Manager", type: "Office" },
  { firstName: "Mia", lastName: "White", gender: "Female", department: "Marketing", location: "Remote", designation: "Content Writer", type: "Remote" },
  { firstName: "Lucas", lastName: "Harris", gender: "Male", department: "IT", location: "Remote", designation: "DevOps Engineer", type: "Remote" },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const depts = await Department.findAll({ where: { isActive: true }, attributes: ["id", "name"] });
    const locs = await OfficeLocation.findAll({ where: { isActive: true }, attributes: ["id", "name"] });
    const deptByName = Object.fromEntries(depts.map((d) => [d.name, d.id]));
    const locByName = Object.fromEntries(locs.map((l) => [l.name, l.id]));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ——— Employees + Professional + Documents + Account ———
    const employeeIds = [];
    for (let i = 0; i < EMPLOYEES_DATA.length; i++) {
      const d = EMPLOYEES_DATA[i];
      const empId = uuidv4();
      const deptId = deptByName[d.department] || depts[0].id;
      const locId = locByName[d.location] || locs[0].id;
      const empCode = `EMP${String(1000 + i + 1).padStart(4, "0")}`;
      const workEmail = `${d.firstName.toLowerCase()}.${d.lastName.toLowerCase()}${i + 1}@company.com`;
      const personalEmail = `${d.firstName.toLowerCase()}.${d.lastName.toLowerCase()}@personal.com`;
      const isActive = i % 4 === 0;
      await Employee.create({
        id: empId,
        firstName: d.firstName,
        lastName: d.lastName,
        mobileNumber: `+1 555 ${String(100 + i).padStart(3, "0")} ${String(1000 + i).padStart(4, "0")}`,
        personalEmail,
        dateOfBirth: `199${i % 10}-0${(i % 9) + 1}-0${(i % 28) + 1}`,
        maritalStatus: i % 3 === 0 ? "Single" : i % 3 === 1 ? "Married" : "Divorced",
        gender: d.gender,
        address: `${100 + i} Main Street`,
        city: i % 2 === 0 ? "New York" : "California",
        avatarUrl: avatarUrl(d.gender, i),
      });
      await EmployeeProfessional.create({
        employeeId: empId,
        employeeIdCode: empCode,
        username: `user${empCode}`,
        employeeType: d.type,
        workEmail,
        departmentId: deptId,
        designation: d.designation,
        workingDays: WORKING_DAYS,
        joiningDate: "2023-01-15",
        officeLocationId: locId,
      });
      await EmployeeDocuments.create({
        employeeId: empId,
        appointmentLetterUrl: "/files/seed-appointment.pdf",
        salarySlipUrls: [],
        relievingLetterUrls: [],
        experienceLetterUrls: [],
      });
      let userId = null;
      if (isActive) {
        let existingUser = await User.findOne({ where: { email: workEmail } });
        if (existingUser) {
          userId = existingUser.id;
        } else {
          const passwordHash = await hashedPassword("Password1");
          const newUser = await User.create({
            email: workEmail,
            password: passwordHash,
            role: i === 0 ? "admin" : i === 2 ? "hr" : "employee",
          });
          userId = newUser.id;
        }
      }
      await EmployeeAccount.create({
        employeeId: empId,
        userId,
        loginEmail: workEmail,
        status: isActive ? "active" : "pending",
      });
      employeeIds.push(empId);
    }

    // ——— Attendance (bugun va oldingi kunlar, present/late) ———
    for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      for (let ei = 0; ei < Math.min(employeeIds.length, 8); ei++) {
        const checkIn = new Date(date);
        checkIn.setHours(9 + (ei % 2), ei % 2 === 0 ? 0 : 35, 0, 0);
        await Attendance.create({
          employeeId: employeeIds[ei],
          checkIn,
          status: ei % 3 === 0 ? "late" : "present",
          workType: EMPLOYEES_DATA[ei].type === "Remote" ? "remote" : "office",
        });
      }
    }

    // ——— Candidates (turli statuslar) ———
    const candidateStatuses = ["Selected", "In Process", "Rejected"];
    const candidateNames = ["Alex Johnson", "Maria Garcia", "David Lee", "Lisa Chen", "Robert Kim", "Anna Patel", "Chris Moore", "Julia Clark", "Daniel Wright", "Rachel Green"];
    const appliedFor = ["UI/UX Designer", "Backend Developer", "HR Executive", "Sales Manager", "Accountant", "Marketing Coordinator", "DevOps Engineer", "Data Analyst", "Project Manager", "Content Writer"];
    const candidateGenders = ["Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female"];
    for (let i = 0; i < candidateNames.length; i++) {
      const [first, last] = candidateNames[i].split(" ");
      await Candidate.create({
        name: candidateNames[i],
        appliedFor: appliedFor[i % appliedFor.length],
        appliedDate: new Date(2024, 6, 14 + i).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        email: `${first.toLowerCase()}.${last.toLowerCase()}@apply.com`,
        mobile: `(555) 200-${String(i).padStart(4, "0")}`,
        status: candidateStatuses[i % 3],
        avatarUrl: avatarUrl(candidateGenders[i], 20 + i),
      });
    }

    // ——— Holidays (o'tgan va kelgusi) ———
    const holidays = [
      { name: "New Year", date: "2025-01-01" },
      { name: "International Women's Day", date: "2025-03-08" },
      { name: "Eid al-Fitr", date: "2025-03-30" },
      { name: "Independence Day", date: "2025-07-04" },
      { name: "Thanksgiving", date: "2025-11-27" },
      { name: "Christmas", date: "2025-12-25" },
      { name: "New Year 2026", date: "2026-01-01" },
      { name: "Company Foundation Day", date: "2026-06-15" },
    ];
    for (const h of holidays) {
      await Holiday.findOrCreate({ where: { date: h.date, name: h.name }, defaults: { date: h.date, name: h.name } });
    }

    // ——— Jobs (active, inactive, completed) ———
    const jobsData = [
      { title: "Senior React Developer", department: "IT", location: "California, USA", amount: "$5500/Month", status: "active", tags: [{ label: "IT" }, { label: "Full Time", variant: "secondary" }, { label: "Remote", variant: "secondary" }] },
      { title: "HR Coordinator", department: "HR", location: "New York, USA", amount: "$3200/Month", status: "active", tags: [{ label: "HR" }, { label: "Full Time", variant: "secondary" }] },
      { title: "Sales Representative", department: "Sales", location: "Texas, USA", amount: "$2800/Month", status: "active", tags: [{ label: "Sales" }, { label: "Full Time", variant: "secondary" }] },
      { title: "Marketing Specialist", department: "Marketing", location: "Remote", amount: "$4000/Month", status: "inactive", tags: [{ label: "Marketing" }, { label: "Remote", variant: "secondary" }] },
      { title: "Financial Analyst", department: "Finance", location: "Head Office", amount: "$4800/Month", status: "completed", tags: [{ label: "Finance" }, { label: "Full Time", variant: "secondary" }] },
      { title: "UI/UX Designer", department: "IT", location: "California, USA", amount: "$4500/Month", status: "active", tags: [{ label: "Design" }, { label: "Full Time", variant: "secondary" }] },
      { title: "Python Developer", department: "IT", location: "Remote", amount: "$5200/Month", status: "inactive", tags: [{ label: "IT" }, { label: "Remote", variant: "secondary" }] },
      { title: "BDM", department: "Sales", location: "New York, USA", amount: "$6000/Month", status: "completed", tags: [{ label: "Sales" }, { label: "Full Time", variant: "secondary" }] },
    ];
    for (const j of jobsData) {
      await Job.findOrCreate({
        where: { title: j.title },
        defaults: { title: j.title, department: j.department, location: j.location, amountPerMonth: j.amount, status: j.status, tags: j.tags },
      });
    }

    // ——— Leaves (Pending, Approved, Rejected) ———
    const leaveTypes = ["Casual Leave", "Sick Leave", "Paid Leave", "Unpaid Leave"];
    const leaveStatuses = ["Pending", "Approved", "Rejected"];
    for (let i = 0; i < EMPLOYEES_DATA.length; i++) {
      const emp = EMPLOYEES_DATA[i];
      const empName = `${emp.firstName} ${emp.lastName}`;
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 30 + i * 3);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + (i % 3) + 1);
      const days = (Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1) + " Days";
      await Leave.create({
        employeeName: empName,
        leaveType: leaveTypes[i % leaveTypes.length],
        fromDate: fromDate.toISOString().slice(0, 10),
        toDate: toDate.toISOString().slice(0, 10),
        days,
        manager: "Mark Williams",
        status: leaveStatuses[i % 3],
        reason: i % 2 === 0 ? "Family event" : "Medical",
        avatarUrl: avatarUrl(emp.gender, i),
      });
    }

    // ——— Notifications (birinchi user uchun) ———
    const firstUser = await User.findOne({ order: [["createdAt", "ASC"]], attributes: ["id"] });
    const notificationsData = [
      { title: "Leave Request", message: "@Robert Fox has applied for leave", time: "Just Now", icon: "user" },
      { title: "Check In Issue", message: "@Alex shared a message regarding check in issue", time: "11:16 AM", icon: "alert" },
      { title: "Applied for Sales Manager", message: "@Shane Watson has applied for job", time: "09:00 AM", icon: "briefcase" },
      { title: "Feedback Received", message: "“It was an amazing experience with your organisation”", time: "Yesterday", icon: "user" },
      { title: "Password Updated", message: "Your password has been updated successfully", time: "Yesterday", icon: "lock" },
      { title: "New Holiday Added", message: "Company Foundation Day has been added to the calendar", time: "2 hours ago", icon: "briefcase" },
      { title: "Payroll Processed", message: "February payroll has been completed for all employees", time: "10:30 AM", icon: "lock" },
    ];
    for (const n of notificationsData) {
      await Notification.create({ ...n, userId: firstUser?.id ?? null });
    }

    // ——— Payroll ———
    const salaries = ["$45000", "$78000", "$60000", "$34000", "$40000", "$55000", "$48000", "$52000", "$38000", "$62000"];
    const perMonth = ["$3500", "$6400", "$5000", "$2800", "$3400", "$4000", "$3800", "$4200", "$3000", "$5100"];
    const deductions = ["-", "$100", "$250", "-", "-", "$50", "$150", "-", "$80", "-"];
    for (let i = 0; i < EMPLOYEES_DATA.length; i++) {
      const empName = `${EMPLOYEES_DATA[i].firstName} ${EMPLOYEES_DATA[i].lastName}`;
      await Payroll.create({
        employeeId: employeeIds[i],
        name: empName,
        ctc: salaries[i % salaries.length],
        salaryPerMonth: perMonth[i % perMonth.length],
        deduction: deductions[i % deductions.length],
        status: i % 3 === 0 ? "Pending" : "Completed",
      });
    }

    // ——— Schedule events (My Schedule) ———
    const scheduleData = [
      { eventDate: "2025-04-06", time: "09:30", title: "Practical Task Review", subtitle: "UI/UX Designer" },
      { eventDate: "2025-04-06", time: "12:00", title: "Resume Review", subtitle: "Magento Developer" },
      { eventDate: "2025-04-06", time: "13:30", title: "Final HR Round", subtitle: "Sales Manager" },
      { eventDate: "2025-04-07", time: "09:30", title: "Practical Task Review", subtitle: "Front end Developer" },
      { eventDate: "2025-04-07", time: "11:00", title: "TL Meeting", subtitle: "React JS" },
      { eventDate: "2025-02-06", time: "10:00", title: "Sprint Planning", subtitle: "Dev Team" },
      { eventDate: "2025-02-07", time: "14:00", title: "Design Review", subtitle: "UI/UX" },
      { eventDate: "2025-05-05", time: "09:00", title: "Interview", subtitle: "Backend Developer" },
    ];
    for (const ev of scheduleData) {
      await ScheduleEvent.findOrCreate({
        where: { eventDate: ev.eventDate, time: ev.time, title: ev.title },
        defaults: ev,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await ScheduleEvent.destroy({ where: {} });
    await Payroll.destroy({ where: {} });
    await Notification.destroy({ where: {} });
    await Leave.destroy({ where: {} });
    await Job.destroy({ where: {} });
    await Holiday.destroy({ where: {} });
    await Candidate.destroy({ where: {} });
    await Attendance.destroy({ where: {} });
    const employees = await Employee.findAll({ attributes: ["id"] });
    const ids = employees.map((e) => e.id);
    if (ids.length) {
      await EmployeeAccount.destroy({ where: { employeeId: ids } });
      await EmployeeDocuments.destroy({ where: { employeeId: ids } });
      await EmployeeProfessional.destroy({ where: { employeeId: ids } });
      await Employee.destroy({ where: { id: ids } });
    }
  },
};
