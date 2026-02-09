const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const ScheduleEvent = sequelize.define(
  "ScheduleEvent",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventDate: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    subtitle: { type: DataTypes.STRING, allowNull: true },
  },
  { timestamps: true, tableName: "ScheduleEvents" }
);

module.exports = ScheduleEvent;
