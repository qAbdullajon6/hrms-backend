const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres' // Connect to default postgres database first
});

async function createDatabase() {
  try {
    await client.connect();
    console.log('PostgreSQLga ulandik...');

    // Check if database exists
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'hrms_db']
    );

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'hrms_db'}`);
      console.log(`✅ "${process.env.DB_NAME || 'hrms_db'}" ma'lumotlar bazasi muvaffaqiyatli yaratildi!`);
    } else {
      console.log(`ℹ️ "${process.env.DB_NAME || 'hrms_db'}" ma'lumotlar bazasi allaqachon mavjud.`);
    }

    await client.end();
    console.log('✅ Baza yaratish jarayoni tugadi.');
  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error.message);
    process.exit(1);
  }
}

createDatabase();