const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const EmployeeDocuments = sequelize.define(
  "EmployeeDocuments",
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
    appointmentLetterUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    salarySlipUrls: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    relievingLetterUrls: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    experienceLetterUrls: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: "EmployeeDocuments",
    timestamps: true,
  }
);

module.exports = EmployeeDocuments;

