require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', `${name}.json`), 'utf8'));
}

async function seedGames(conn) {
  const games = loadJson('games');
  for (const g of games) {
    await conn.query(
      `INSERT INTO games (id, slug, name, description, icon, color, min_age, difficulty_levels)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
         icon = VALUES(icon), color = VALUES(color), min_age = VALUES(min_age),
         difficulty_levels = VALUES(difficulty_levels)`,
      [uuidv4(), g.slug, g.name, g.description, g.icon, g.color, g.min_age, JSON.stringify(g.difficulty_levels)]
    );
  }
  console.log(`  games: ${games.length}`);
}

async function seedVerses(conn) {
  const verses = loadJson('verses');
  for (const v of verses) {
    await conn.query(
      `INSERT INTO verses (id, reference, text, book, chapter, verse_number, difficulty, speaker)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), v.reference, v.text, v.book, v.chapter, v.verse_number, v.difficulty, v.speaker]
    );
  }
  console.log(`  verses: ${verses.length}`);
}

async function seedQuizQuestions(conn) {
  const questions = loadJson('quiz_questions');
  for (const q of questions) {
    await conn.query(
      `INSERT INTO quiz_questions (id, game_type, question, correct_answer, wrong_answers, explanation, difficulty, category, verse_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), q.game_type, q.question, q.correct_answer,
        JSON.stringify(q.wrong_answers || []), q.explanation, q.difficulty,
        q.category, q.verse_reference,
      ]
    );
  }
  console.log(`  quiz_questions: ${questions.length}`);
}

async function seedBibleWords(conn) {
  const words = loadJson('bible_words');
  for (const w of words) {
    await conn.query(
      `INSERT INTO bible_words (id, word, hint, category, difficulty) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), w.word, w.hint, w.category, w.difficulty]
    );
  }
  console.log(`  bible_words: ${words.length}`);
}

async function seedBibleCharacters(conn) {
  const characters = loadJson('bible_characters');
  for (const c of characters) {
    await conn.query(
      `INSERT INTO bible_characters (id, name, story_title, story_description, book, difficulty)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), c.name, c.story_title, c.story_description, c.book, c.difficulty]
    );
  }
  console.log(`  bible_characters: ${characters.length}`);
}

async function seedAdmin(conn) {
  const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', ['admin@jeuxbibliques.local']);
  if (rows.length > 0) return;

  const passwordHash = await bcrypt.hash('change-me-please', 10);
  await conn.query(
    `INSERT INTO users (id, email, password, username, is_admin, age_group)
     VALUES (?, ?, ?, ?, 1, 'adult')`,
    [uuidv4(), 'admin@jeuxbibliques.local', passwordHash, 'Admin']
  );
  console.log('  admin user: created (admin@jeuxbibliques.local / change-me-please — a changer !)');
}

async function seed() {
  const conn = await pool.getConnection();
  try {
    const [[{ count }]] = await conn.query('SELECT COUNT(*) as count FROM games');

    if (count === 0) {
      console.log('Seeding content...');
      await seedGames(conn);
      await seedVerses(conn);
      await seedQuizQuestions(conn);
      await seedBibleWords(conn);
      await seedBibleCharacters(conn);
    } else {
      console.log('Content already seeded, skipping (idempotent).');
    }

    await seedAdmin(conn);
    console.log('Seeding complete.');
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
