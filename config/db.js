const pg = require("pg");
const { Sequelize } = require("sequelize");
require("dotenv").config();

const commonOptions = {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,
  dialectOptions: {
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
    connectTimeout: 60000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const sequelize = process.env.POSTGRES_URL
  ? new Sequelize(process.env.POSTGRES_URL, commonOptions)
  : new Sequelize({
      database: process.env.DB_NAME || "hrms_db",
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      ...commonOptions,
    });

// Database yaratish funksiyasi
const createDatabaseIfNotExists = async () => {
  // Managed DB (Render, etc.) usually does not allow CREATE DATABASE.
  // If you provide POSTGRES_URL or explicitly skip, we won't try.
  if (process.env.SKIP_DB_CREATE === "true" || process.env.POSTGRES_URL) {
    return;
  }

  const dbName = process.env.DB_NAME || 'hrms_db';
  const tempSequelize = new Sequelize({
    database: 'postgres', // Default postgres database
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      connectTimeout: 60000
    }
  });

  try {
    await tempSequelize.authenticate();
    console.log('PostgreSQL serveriga ulandik...');

    // Database mavjudligini tekshirish
    const [results] = await tempSequelize.query(
      `SELECT datname FROM pg_database WHERE datname = '${dbName}'`
    );

    if (results.length === 0) {
      console.log(`"${dbName}" ma'lumotlar bazasi topilmadi. Yaratilmoqda...`);
      await tempSequelize.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ "${dbName}" ma'lumotlar bazasi muvaffaqiyatli yaratildi!`);
    } else {
      console.log(`ℹ️ "${dbName}" ma'lumotlar bazasi allaqachon mavjud.`);
    }

    await tempSequelize.close();
  } catch (error) {
    console.error('Database yaratishda xatolik:', error.message);

    // SSL error bo'lsa, SSL siz urinib ko'ramiz
    if (error.message.includes('SSL') || error.message.includes('does not support SSL')) {
      console.log('⚠️ SSL ulanish qo\'llab-quvvatlanmaydi. SSL siz urinib ko\'ramiz...');

      const tempSequelizeNoSSL = new Sequelize({
        database: 'postgres',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        dialectModule: pg,
        logging: false,
        dialectOptions: {
          ssl: false,
          connectTimeout: 60000
        }
      });

      try {
        await tempSequelizeNoSSL.authenticate();
        console.log('PostgreSQL serveriga (SSL siz) ulandik...');

        const [results] = await tempSequelizeNoSSL.query(
          `SELECT datname FROM pg_database WHERE datname = '${dbName}'`
        );

        if (results.length === 0) {
          console.log(`"${dbName}" ma'lumotlar bazasi topilmadi. Yaratilmoqda...`);
          await tempSequelizeNoSSL.query(`CREATE DATABASE "${dbName}"`);
          console.log(`✅ "${dbName}" ma'lumotlar bazasi muvaffaqiyatli yaratildi!`);
        } else {
          console.log(`ℹ️ "${dbName}" ma'lumotlar bazasi allaqachon mavjud.`);
        }

        await tempSequelizeNoSSL.close();
        return;
      } catch (noSSLError) {
        console.error('SSL siz ham ulanib bo\'lmadi:', noSSLError.message);
        await tempSequelizeNoSSL.close();
      }
    }

    await tempSequelize.close();
    throw error;
  }
};

// Database va tablelarni sozlash
const initializeDatabase = async () => {
  try {
    // Database mavjudligini tekshirish va yaratish
    await createDatabaseIfNotExists();

    // Asosiy database ga ulanish
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database ga muvaffaqiyatli ulandik');

    const shouldSync = process.env.DB_SYNC !== "false";
    const alter =
      process.env.DB_SYNC_ALTER === "true" ||
      (process.env.DB_SYNC_ALTER !== "false" && process.env.NODE_ENV !== "production");

    if (shouldSync) {
      // Tablelarni yaratish/sync qilish
      const { Department, OfficeLocation } = require("../models/relations");

      await sequelize.sync({ force: false, alter });
      console.log("✅ Barcha tablelar muvaffaqiyatli yaratildi/yangilandi");

      // Seed minimal lookups (idempotent)
      if (process.env.DB_SEED_LOOKUPS !== "false") {
        try {
          const deptCount = await Department.count();
          if (deptCount === 0) {
            await Department.bulkCreate(
              [
                { name: "Development" },
                { name: "Design" },
                { name: "Sales" },
                { name: "HR" },
                { name: "Project Management" },
                { name: "Business Analysis" },
              ],
              { ignoreDuplicates: true }
            );
          }

          const locCount = await OfficeLocation.count();
          if (locCount === 0) {
            await OfficeLocation.bulkCreate(
              [{ name: "Head Office" }, { name: "Branch Office" }, { name: "Remote" }],
              { ignoreDuplicates: true }
            );
          }
        } catch (seedErr) {
          console.warn("⚠️ Lookups seed skipped:", seedErr.message);
        }
      }
    } else {
      console.log("ℹ️ DB sync skipped (DB_SYNC=false).");
    }

  } catch (error) {
    console.error('❌ Database initialization da xatolik:', error.message);
    console.error('Muammo tufayli server to\'xtatildi');
    process.exit(1);
  }
};

module.exports = sequelize;
module.exports.initializeDatabase = initializeDatabase;