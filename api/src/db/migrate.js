require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function ensureColumn(connection, table, column, definition) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length === 0) {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  colonne ajoutee : ${table}.${column}`);
  }
}

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'jeuxbibliques',
    multipleStatements: true,
  });

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  console.log('Running migrations...');
  await connection.query(sql);

  // La table users existait deja avant l'ajout de ces colonnes :
  // CREATE TABLE IF NOT EXISTS ne les ajoute pas retroactivement.
  await ensureColumn(connection, 'users', 'email_verified', "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn(connection, 'users', 'verification_token', "CHAR(36) NULL");
  await ensureColumn(connection, 'users', 'verification_token_expires', "DATETIME NULL");

  console.log('Migrations complete.');

  await connection.end();
}

module.exports = { migrate };

if (require.main === module) {
  migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
