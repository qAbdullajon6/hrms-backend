// models/employee.js
// V2 (recommended): Employee jadvali shaxsiy (personal) ma’lumotlarni saqlaydi.
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Employee = sequelize.define(
  "Employee",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // allowNull:true — existing DB rows bo'lsa ham sync/alter yiqilmasin.
    // Required qoidalar controller/validator level'da enforce qilinadi.
    firstName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    mobileNumber: { type: DataTypes.STRING, allowNull: true },
    personalEmail: { type: DataTypes.STRING, allowNull: true },
    dateOfBirth: { type: DataTypes.STRING, allowNull: true }, // YYYY-MM-DD
    maritalStatus: { type: DataTypes.STRING, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true },
    nationality: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    zipCode: { type: DataTypes.STRING, allowNull: true },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
  },
  {
    timestamps: true,
    tableName: "Employees",
  }
);

module.exports = Employee;
