const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const StepTwo = sequelize.define(
  "StepTwo",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeid: {
      type: DataTypes.STRING, 
      allowNull: false,
    },
    // create uchun minimal majburiy: employeeType, department, designation, joiningDate, workLocation
    userName: { type: DataTypes.STRING, allowNull: true },
    employeeType: { type: DataTypes.STRING, allowNull: false },
    emailAddress: { type: DataTypes.STRING, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: false },
    designation: { type: DataTypes.STRING, allowNull: false },
    workDays: { type: DataTypes.STRING, allowNull: true },
    joiningDate: { type: DataTypes.STRING, allowNull: false },
    workLocation: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "StepTwos",
    timestamps: true,
  }
);

module.exports = StepTwo;
