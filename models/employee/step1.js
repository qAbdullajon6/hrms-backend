// models/stepOne.js
const { DataTypes } = require("sequelize");
const Employee = require("./employee");
const sequelize = require("../../config/db");

const StepOne = sequelize.define(
  "StepOne",
  {
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    mobileNumber: { type: DataTypes.STRING, allowNull: false },
    emailAddress: { type: DataTypes.STRING, allowNull: false },
    // qolganlari optional: agar siz HR siyosatingiz bo'yicha majburiy qilmoqchi bo'lsangiz, allowNull: false qiling
    dateOfBirth: { type: DataTypes.STRING, allowNull: true },
    maritalStatus: { type: DataTypes.STRING, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true },
    nationality: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    zipCode: { type: DataTypes.STRING, allowNull: true },
    imagePath: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Employee,
        key: "id",
      },
      unique: true, // one-to-one bog‘lanish uchun
    },
  },
  {
    timestamps: true,
  }
);

StepOne.belongsTo(Employee, { foreignKey: "employeeId" });
Employee.hasOne(StepOne, { foreignKey: "employeeId" });

module.exports = StepOne;
