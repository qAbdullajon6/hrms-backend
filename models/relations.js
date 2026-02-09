// Central place to register models & associations.
const ResetCode = require("./code/code.model");
const Employee = require("./employee/employee");
const EmployeeProfessional = require("./employee/employeeProfessional.model");
const EmployeeDocuments = require("./employee/employeeDocuments.model");
const EmployeeAccount = require("./employee/employeeAccount.model");
const InviteToken = require("./employee/inviteToken.model");
const Department = require("./lookups/department.model");
const OfficeLocation = require("./lookups/officeLocation.model");
const RefreshToken = require("./tokens/token.model");
const User = require("./user/user.model");
const Attendance = require("./attendance/attendance.model");
const Project = require("./project/project.model");
const Holiday = require("./holiday/holiday.model");
const Candidate = require("./candidate/candidate.model");
const Job = require("./job/job.model");
const Leave = require("./leave/leave.model");
const Notification = require("./notification/notification.model");
const Payroll = require("./payroll/payroll.model");
const ScheduleEvent = require("./schedule/scheduleEvent.model");
const Settings = require("./settings/settings.model");

// V2 recommended relationships
EmployeeProfessional.belongsTo(Employee, { foreignKey: "employeeId", onDelete: "CASCADE" });
EmployeeDocuments.belongsTo(Employee, { foreignKey: "employeeId", onDelete: "CASCADE" });
EmployeeAccount.belongsTo(Employee, { foreignKey: "employeeId", onDelete: "CASCADE" });
InviteToken.belongsTo(Employee, { foreignKey: "employeeId", onDelete: "CASCADE" });

Employee.hasOne(EmployeeProfessional, { foreignKey: "employeeId", onDelete: "CASCADE" });
Employee.hasOne(EmployeeDocuments, { foreignKey: "employeeId", onDelete: "CASCADE" });
Employee.hasOne(EmployeeAccount, { foreignKey: "employeeId", onDelete: "CASCADE" });
Employee.hasMany(InviteToken, { foreignKey: "employeeId", onDelete: "CASCADE" });

EmployeeProfessional.belongsTo(Department, { foreignKey: "departmentId" });
Department.hasMany(EmployeeProfessional, { foreignKey: "departmentId" });

EmployeeProfessional.belongsTo(OfficeLocation, { foreignKey: "officeLocationId" });
OfficeLocation.hasMany(EmployeeProfessional, { foreignKey: "officeLocationId" });

EmployeeAccount.belongsTo(User, { foreignKey: "userId" });
User.hasOne(EmployeeAccount, { foreignKey: "userId" });

// Attendance relationships
Attendance.belongsTo(Employee, { foreignKey: "employeeId", onDelete: "CASCADE" });
Employee.hasMany(Attendance, { foreignKey: "employeeId", onDelete: "CASCADE" });

// Project relationships
Project.belongsTo(Employee, { foreignKey: "managerId", as: "manager", onDelete: "SET NULL" });
Employee.hasMany(Project, { foreignKey: "managerId", as: "managedProjects", onDelete: "SET NULL" });

// Payroll relationships (constraints: false — DB da FK qo‘yilmaydi, eski yozuvlar buzilmasin)
Payroll.belongsTo(Employee, { foreignKey: "employeeId", onDelete: "SET NULL", constraints: false });
Employee.hasMany(Payroll, { foreignKey: "employeeId", constraints: false });

module.exports = {
  User,
  RefreshToken,
  ResetCode,
  Employee,
  EmployeeProfessional,
  EmployeeDocuments,
  EmployeeAccount,
  InviteToken,
  Department,
  OfficeLocation,
  Attendance,
  Project,
  Holiday,
  Candidate,
  Job,
  Leave,
  Notification,
  Payroll,
  ScheduleEvent,
  Settings,
};
