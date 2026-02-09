const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Holiday = sequelize.define(
  "Holiday",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
  },
  { timestamps: true, tableName: "Holidays" }
);
module.exports = Holiday;
