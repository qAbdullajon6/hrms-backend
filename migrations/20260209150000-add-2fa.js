"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "twoFactorEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("ResetCodes", "purpose", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "password_reset",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Users", "twoFactorEnabled");
    await queryInterface.removeColumn("ResetCodes", "purpose");
  },
};
