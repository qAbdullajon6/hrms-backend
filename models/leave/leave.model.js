const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Leave = sequelize.define(
  "Leave",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: { type: DataTypes.UUID, allowNull: true },
    employeeName: { type: DataTypes.STRING, allowNull: false },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    leaveType: { type: DataTypes.STRING, allowNull: false },
    fromDate: { type: DataTypes.DATEONLY, allowNull: false },
    toDate: { type: DataTypes.DATEONLY, allowNull: false },
    days: { type: DataTypes.STRING, allowNull: false },
    manager: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      allowNull: false,
      defaultValue: "Pending",
    },
    reason: { type: DataTypes.TEXT, allowNull: true },
  },
  { timestamps: true, tableName: "Leaves" }
);
module.exports = Leave;
