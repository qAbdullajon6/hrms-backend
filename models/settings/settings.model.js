const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Settings = sequelize.define(
  "Settings",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  { timestamps: true, tableName: "Settings" }
);

module.exports = Settings;
