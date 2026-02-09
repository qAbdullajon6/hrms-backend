"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Settings", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      key: { type: Sequelize.STRING, allowNull: false, unique: true },
      value: { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addColumn("Attendances", "breakStart", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("Attendances", "breakEnd", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Attendances", "breakEnd");
    await queryInterface.removeColumn("Attendances", "breakStart");
    await queryInterface.dropTable("Settings");
  },
};
