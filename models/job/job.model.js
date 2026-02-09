const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Job = sequelize.define(
  "Job",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    amountPerMonth: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive", "completed"),
      allowNull: false,
      defaultValue: "active",
    },
    tags: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  },
  { timestamps: true, tableName: "Jobs" }
);
module.exports = Job;
