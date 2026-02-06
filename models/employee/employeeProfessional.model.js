const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const EmployeeProfessional = sequelize.define(
  "EmployeeProfessional",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    employeeIdCode: {
      // EMP001
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    employeeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    workEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    workingDays: {
      // ["Monday","Tuesday",...]
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    joiningDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    officeLocationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "EmployeeProfessional",
    timestamps: true,
  }
);

module.exports = EmployeeProfessional;

