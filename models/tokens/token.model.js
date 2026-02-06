const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const RefreshToken = sequelize.define(
  "RefreshTokens",
  {
    userId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  { timestamps: true }
);

module.exports = RefreshToken;
