'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require('uuid');
    const now = new Date();

    const departments = ['HR', 'IT', 'Finance', 'Marketing', 'Sales'];
    for (const name of departments) {
      await queryInterface.sequelize.query(
        `INSERT INTO "Departments" ("id","name","isActive","createdAt","updatedAt")
         VALUES (:id, :name, true, :now, :now)
         ON CONFLICT ("name") DO NOTHING`,
        { replacements: { id: uuidv4(), name, now } }
      );
    }

    const locations = ['Head Office', 'Branch Office', 'Remote'];
    for (const name of locations) {
      await queryInterface.sequelize.query(
        `INSERT INTO "OfficeLocations" ("id","name","isActive","createdAt","updatedAt")
         VALUES (:id, :name, true, :now, :now)
         ON CONFLICT ("name") DO NOTHING`,
        { replacements: { id: uuidv4(), name, now } }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Departments', null, {});
    await queryInterface.bulkDelete('OfficeLocations', null, {});
  },
};

