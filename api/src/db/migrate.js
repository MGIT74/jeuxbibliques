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

// Elargit une colonne existante si son type ne correspond plus a ce qui est
// attendu (ex : VARCHAR(500) -> LONGTEXT pour stocker des images en base64).
async function ensureColumnType(connection, table, column, expectedType, alterDefinition) {
  const [rows] = await connection.query(
    `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length > 0 && rows[0].DATA_TYPE !== expectedType) {
    await connection.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${alterDefinition}`);
    console.log(`  colonne elargie : ${table}.${column} -> ${expectedType}`);
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
  await ensureColumn(connection, 'users', 'password_reset_token', "CHAR(36) NULL");
  await ensureColumn(connection, 'users', 'password_reset_token_expires', "DATETIME NULL");

  // banners.image_url : passe de VARCHAR(500) a LONGTEXT pour stocker les
  // images directement en base64 (simplifie l'upload : plus de fichiers,
  // plus de dossier /uploads, plus de dependance a multer).
  await ensureColumnType(connection, 'banners', 'image_url', 'longtext', 'LONGTEXT NOT NULL');

  // games.cover_image_url : image de couverture carree (design "vrai jeu"),
  // uploadee par l'admin en base64, en complement de l'icone existante.
  await ensureColumn(connection, 'games', 'cover_image_url', 'LONGTEXT NULL');

  // users.hearts : monnaie persistante (indices) gagnee via les cartes a
  // collectionner, utilisable pour reveler une lettre dans Devine le Mot.
  await ensureColumn(connection, 'users', 'hearts', 'INT UNSIGNED NOT NULL DEFAULT 0');

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
