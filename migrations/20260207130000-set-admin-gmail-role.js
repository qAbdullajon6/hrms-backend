'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const seq = queryInterface.sequelize;
    if (!seq) return;
    await seq.query(
      `UPDATE "Users" SET "role" = 'admin' WHERE "email" = 'admin@gmail.com';`
    );
  },

  async down(queryInterface) {
    const seq = queryInterface.sequelize;
    if (!seq) return;
    await seq.query(
      `UPDATE "Users" SET "role" = 'employee' WHERE "email" = 'admin@gmail.com';`
    );
  },
};
