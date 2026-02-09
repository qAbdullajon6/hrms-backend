const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Candidate = sequelize.define(
  "Candidate",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    appliedFor: { type: DataTypes.STRING, allowNull: false },
    appliedDate: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    mobile: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM("Selected", "In Process", "Rejected"),
      allowNull: false,
      defaultValue: "In Process",
    },
  },
  { timestamps: true, tableName: "Candidates" }
);
module.exports = Candidate;
