const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Payroll = sequelize.define(
  "Payroll",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    ctc: { type: DataTypes.STRING, allowNull: false },
    salaryPerMonth: { type: DataTypes.STRING, allowNull: false },
    deduction: { type: DataTypes.STRING, allowNull: true, defaultValue: "-" },
    status: {
      type: DataTypes.ENUM("Completed", "Pending"),
      allowNull: false,
      defaultValue: "Pending",
    },
  },
  { timestamps: true, tableName: "Payrolls" }
);
module.exports = Payroll;
