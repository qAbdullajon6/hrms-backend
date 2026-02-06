// models/stepFour.js
const { DataTypes } = require("sequelize");
const Employee = require("./employee");
const sequelize = require("../../config/db");

const StepFour = sequelize.define("StepFour", {
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Employee,
      key: 'id',
    },
    unique: true,
  },
  // Account Access ma'lumotlari ko'p HRMSlarda optional bo'ladi (keyinroq to'ldiriladi).
  email: { type: DataTypes.STRING, allowNull: true },
  slackId: { type: DataTypes.STRING, allowNull: true },
  skypeId: { type: DataTypes.STRING, allowNull: true },
  githubId: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
});

StepFour.belongsTo(Employee, { foreignKey: "employeeId" });
Employee.hasOne(StepFour, { foreignKey: "employeeId" });

module.exports = StepFour;
