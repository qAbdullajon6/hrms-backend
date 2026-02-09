"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Notifications", "userId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "Users", key: "id" },
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Notifications", "userId");
  },
};
