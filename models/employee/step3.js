// models/stepThree.js
const { DataTypes } = require("sequelize");
const Employee = require("./employee");
const sequelize = require("../../config/db");

const StepThree = sequelize.define("StepThree", {
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Employee,
      key: 'id',
    },
    unique: true,
  },
  appointmentLetter: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  relivingLetter: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  salarySlips: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  experienceLetter: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
}, {
  timestamps: true,
});

StepThree.belongsTo(Employee, { foreignKey: "employeeId" });
Employee.hasOne(StepThree, { foreignKey: "employeeId" });

module.exports = StepThree;