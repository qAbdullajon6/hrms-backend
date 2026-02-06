const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const EmployeeAccount = sequelize.define(
  "EmployeeAccount",
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
    loginEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "disabled"),
      allowNull: false,
      defaultValue: "pending",
    },
    slackId: { type: DataTypes.STRING, allowNull: true },
    skypeId: { type: DataTypes.STRING, allowNull: true },
    githubId: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "EmployeeAccounts",
    timestamps: true,
  }
);

module.exports = EmployeeAccount;

