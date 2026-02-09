"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, sequelize) {
    await queryInterface.changeColumn("EmployeeDocuments", "appointmentLetterUrl", {
      type: sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, sequelize) {
    await queryInterface.changeColumn("EmployeeDocuments", "appointmentLetterUrl", {
      type: sequelize.STRING,
      allowNull: false,
    });
  },
};
