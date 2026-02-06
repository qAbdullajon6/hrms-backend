const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const InviteToken = sequelize.define(
  "InviteToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "InviteTokens",
    timestamps: true,
    indexes: [
      { fields: ["employeeId"] },
      { fields: ["token"], unique: true },
    ],
  }
);

module.exports = InviteToken;

