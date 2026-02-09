'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') {
      await queryInterface.addColumn('Users', 'role', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'employee',
      });
      return;
    }
    // PostgreSQL: add column if not exists, then ensure type is varchar
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) NOT NULL DEFAULT 'employee';
    `);
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users"
        ALTER COLUMN "role" TYPE VARCHAR(50) USING "role"::text,
        ALTER COLUMN "role" SET DEFAULT 'employee';
      `);
    } catch (_) {
      // Column may already be varchar, ignore
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'employee',
    });
  },
};
