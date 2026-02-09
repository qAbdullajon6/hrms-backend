/**
 * Role-based permissions.
 * Roles: admin, hr, manager, designer, developer, employee
 */

const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  DESIGNER: 'designer',
  DEVELOPER: 'developer',
  EMPLOYEE: 'employee',
};

/** Roles that can create / edit / delete employees */
const CAN_MANAGE_EMPLOYEES = [ROLES.ADMIN, ROLES.HR];

/** Roles that can create / edit / delete candidates */
const CAN_MANAGE_CANDIDATES = [ROLES.ADMIN, ROLES.HR];

/** Roles that can create / edit / delete holidays */
const CAN_MANAGE_HOLIDAYS = [ROLES.ADMIN, ROLES.HR];

/** Roles that can create / edit jobs */
const CAN_MANAGE_JOBS = [ROLES.ADMIN, ROLES.HR];

/** Roles that can manage payroll (view all, edit) */
const CAN_MANAGE_PAYROLL = [ROLES.ADMIN, ROLES.HR];

/** Roles that can manage leaves (approve, cancel others) */
const CAN_MANAGE_LEAVES = [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER];

/** Roles that can manage departments / settings */
const CAN_MANAGE_SETTINGS = [ROLES.ADMIN];

function hasRole(userRole, allowedRoles) {
  if (!userRole) return false;
  return allowedRoles.includes(String(userRole).toLowerCase());
}

function canManageEmployees(role) {
  return hasRole(role, CAN_MANAGE_EMPLOYEES);
}

function canManageCandidates(role) {
  return hasRole(role, CAN_MANAGE_CANDIDATES);
}

function canManageHolidays(role) {
  return hasRole(role, CAN_MANAGE_HOLIDAYS);
}

function canManageJobs(role) {
  return hasRole(role, CAN_MANAGE_JOBS);
}

function canManagePayroll(role) {
  return hasRole(role, CAN_MANAGE_PAYROLL);
}

function canManageLeaves(role) {
  return hasRole(role, CAN_MANAGE_LEAVES);
}

function canManageSettings(role) {
  return hasRole(role, CAN_MANAGE_SETTINGS);
}

module.exports = {
  ROLES,
  CAN_MANAGE_EMPLOYEES,
  CAN_MANAGE_CANDIDATES,
  CAN_MANAGE_HOLIDAYS,
  CAN_MANAGE_JOBS,
  CAN_MANAGE_PAYROLL,
  CAN_MANAGE_LEAVES,
  CAN_MANAGE_SETTINGS,
  hasRole,
  canManageEmployees,
  canManageCandidates,
  canManageHolidays,
  canManageJobs,
  canManagePayroll,
  canManageLeaves,
  canManageSettings,
};
