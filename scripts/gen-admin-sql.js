/**
 * Generates SQL to insert admin user (admin@gmail.com) into "Users" table.
 * Run: node scripts/gen-admin-sql.js
 * Then paste the output into psql connected to your Render DB.
 *
 * Login: admin@gmail.com / password
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const email = 'admin@gmail.com';
const plainPassword = 'password';

async function main() {
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const id = uuidv4();
  // Escape single quotes for SQL
  const safeHash = hashedPassword.replace(/'/g, "''");
  const sql = `INSERT INTO "Users" ("id", "email", "password", "role", "createdAt", "updatedAt")
VALUES ('${id}', '${email}', '${safeHash}', 'admin', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET "password" = EXCLUDED."password", "role" = EXCLUDED."role";`;
  console.log(sql);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
