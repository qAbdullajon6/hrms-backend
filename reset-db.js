const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres'
});

async function resetDatabase() {
  const dbName = process.env.DB_NAME || 'hrms_db';

  try {
    console.log('🔄 Database reset boshlanmoqda...');

    await client.connect();
    console.log('PostgreSQL serveriga ulandik...');

    // Terminate active connections to the database
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
    `);

    // Drop database if exists
    await client.query(`DROP DATABASE IF EXISTS "${dbName}";`);
    console.log(`🗑️ "${dbName}" ma'lumotlar bazasi o'chirildi`);

    // Create new database
    await client.query(`CREATE DATABASE "${dbName}";`);
    console.log(`✅ "${dbName}" ma'lumotlar bazasi yaratildi`);

    await client.end();
    console.log('✅ Database reset tugadi');

  } catch (error) {
    console.error('❌ Database reset da xatolik:', error.message);
    process.exit(1);
  }
}

resetDatabase();