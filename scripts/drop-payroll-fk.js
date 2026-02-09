/**
 * Payrolls jadvalidan employeeId foreign key ni olib tashlash.
 * Ishga tushirish: node scripts/drop-payroll-fk.js
 */
require("dotenv").config();
const { Sequelize } = require("sequelize");
const dbConfig = require("../config/db-config");

async function main() {
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: false,
    }
  );

  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE "Payrolls" DROP CONSTRAINT IF EXISTS "Payrolls_employeeId_fkey";');
    console.log("OK: Payrolls_employeeId_fkey constraint olib tashlandi (yoki mavjud emas edi).");
  } catch (err) {
    console.error("Xato:", err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
