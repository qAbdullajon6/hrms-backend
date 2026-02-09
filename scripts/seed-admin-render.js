/**
 * Render Postgres ga ulanib admin@gmail.com / password yaratadi.
 * Ishga tushirish: POSTGRES_URL="postgres://..." node scripts/seed-admin-render.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Sequelize } = require("sequelize");
const pg = require("pg");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL o‘rnating. Masalan: set POSTGRES_URL=postgres://user:...@host/db?sslmode=require");
  process.exit(1);
}

const sequelize = new Sequelize(url, {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
});

async function main() {
  const email = "admin@gmail.com";
  const plainPassword = "password";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const id = uuidv4();

  try {
    await sequelize.authenticate();
    console.log("Render Postgres ga ulandik.");
  } catch (e) {
    console.error("Ulanish xatosi:", e.message);
    process.exit(1);
  }

  const [rows] = await sequelize.query(
    `INSERT INTO "Users" ("id", "email", "password", "role", "createdAt", "updatedAt")
     VALUES (:id, :email, :password, 'admin', NOW(), NOW())
     ON CONFLICT ("email") DO UPDATE SET "password" = EXCLUDED."password", "role" = EXCLUDED."role"
     RETURNING id, email, role`,
    {
      replacements: { id, email, password: hashedPassword },
    }
  );

  console.log("Admin yaratildi/yangilandi:", rows[0] || "OK");
  console.log("Kirish: email = admin@gmail.com, parol = password");
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
