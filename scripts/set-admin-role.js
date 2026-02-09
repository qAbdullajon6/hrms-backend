/**
 * admin@gmail.com foydalanuvchisining rolini 'admin' qiladi.
 * Ishga tushirish: node scripts/set-admin-role.js
 * Yoki: cd backend && node scripts/set-admin-role.js
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');

const config = require('../config/db-config.js');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port || 5432,
  dialect: config.dialect || 'postgres',
  logging: false,
});

async function main() {
  try {
    const [results] = await sequelize.query(
      `UPDATE "Users" SET "role" = 'admin' WHERE "email" = 'admin@gmail.com' RETURNING id, email, role;`
    );
    if (results && results.length > 0) {
      console.log('OK: admin@gmail.com endi admin roliga o\'rnatildi.', results[0]);
    } else {
      console.log('admin@gmail.com bazada topilmadi. Avval shu email bilan ro\'yxatdan o\'ting yoki seeder ishga tushiring.');
    }
  } catch (err) {
    console.error('Xato:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
