"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE "Payrolls" DROP CONSTRAINT IF EXISTS "Payrolls_employeeId_fkey";'
      );
    } catch (e) {
      // Constraint mavjud bo‘lmasa ham xato bermaslik
    }
  },

  async down() {
    // Qaytarishda FK qo‘yilmaydi (constraints: false ishlatiladi)
  },
};
