'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const email = 'admin@gmail.com';
    const plainPassword = 'password';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Idempotent insert (won't fail if user already exists)
    await queryInterface.sequelize.query(
      `
      INSERT INTO "Users" ("id", "email", "password", "role", "createdAt", "updatedAt")
      VALUES (:id, :email, :password, :role, NOW(), NOW())
      ON CONFLICT ("email") DO UPDATE SET "role" = EXCLUDED."role";
      `,
      {
        replacements: {
          id: uuidv4(),
          email,
          password: hashedPassword,
          role: "admin",
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'admin@gmail.com' }, {});
  },
};

