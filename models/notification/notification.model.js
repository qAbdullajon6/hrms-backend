const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: true, references: { model: "Users", key: "id" } },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    time: { type: DataTypes.STRING, allowNull: true },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    icon: {
      type: DataTypes.ENUM("user", "briefcase", "lock", "alert"),
      allowNull: true,
    },
  },
  { timestamps: true, tableName: "Notifications" }
);
module.exports = Notification;
