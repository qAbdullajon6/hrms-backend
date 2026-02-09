const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Attendance = sequelize.define(
  "Attendance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
      primaryKey: true
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Employees',
        key: 'id'
      }
    },
    checkIn: {
      type: DataTypes.DATE,
      allowNull: false
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('present', 'late', 'absent'),
      defaultValue: 'present',
      allowNull: false
    },
    workType: {
      type: DataTypes.ENUM('office', 'remote'),
      defaultValue: 'office',
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    breakStart: {
      type: DataTypes.DATE,
      allowNull: true
    },
    breakEnd: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  { timestamps: true }
);

module.exports = Attendance;