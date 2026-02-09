const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const ResetCode = sequelize.define("ResetCode", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiry: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "password_reset",
  },
});

module.exports = ResetCode;
