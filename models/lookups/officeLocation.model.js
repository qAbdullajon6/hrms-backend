const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const OfficeLocation = sequelize.define(
  "OfficeLocation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "OfficeLocations",
    timestamps: true,
  }
);

module.exports = OfficeLocation;

