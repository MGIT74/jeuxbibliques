const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

function parseJsonField(row, field) {
  if (row && row[field] && typeof row[field] === 'string') {
    try {
      row[field] = JSON.parse(row[field]);
    } catch {
      // laisse tel quel si ce n'est pas du JSON valide
    }
  }
  return row;
}

// GET /games — seuls les jeux actifs apparaissent dans le menu public.
// Un jeu masque reste volontairement joignable via /games/:slug (lien
// direct) pour permettre a l'admin de le tester avant de le republier.
router.get('/games', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM games WHERE is_active = 1 ORDER BY min_age ASC');
  res.json(rows.map((r) => parseJsonField(r, 'difficulty_levels')));
});

// GET /games/:slug
router.get('/games/:slug', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM games WHERE slug = ?', [req.params.slug]);
  if (rows.length === 0) return res.status(404).json({ message: 'Jeu introuvable.' });
  res.json(parseJsonField(rows[0], 'difficulty_levels'));
});

// GET /verses?difficulty=easy
router.get('/verses', async (req, res) => {
  const { difficulty } = req.query;
  const query = difficulty
    ? ['SELECT * FROM verses WHERE difficulty = ?', [difficulty]]
    : ['SELECT * FROM verses', []];
  const [rows] = await pool.query(...query);
  res.json(rows);
});

// GET /quiz-questions?game_type=quiz&difficulty=easy
router.get('/quiz-questions', async (req, res) => {
  const { game_type, difficulty } = req.query;
  const validTypes = ['quiz', 'true_false', 'who_said', 'character_match'];

  if (!game_type || !validTypes.includes(game_type)) {
    return res.status(422).json({ errors: { game_type: ['game_type invalide ou manquant.'] } });
  }

  const params = [game_type];
  let sql = 'SELECT * FROM quiz_questions WHERE game_type = ?';
  if (difficulty) {
    sql += ' AND difficulty = ?';
    params.push(difficulty);
  }

  const [rows] = await pool.query(sql, params);
  res.json(rows.map((r) => parseJsonField(r, 'wrong_answers')));
});

// GET /bible-words?difficulty=easy
router.get('/bible-words', async (req, res) => {
  const { difficulty } = req.query;
  const query = difficulty
    ? ['SELECT * FROM bible_words WHERE difficulty = ?', [difficulty]]
    : ['SELECT * FROM bible_words', []];
  const [rows] = await pool.query(...query);
  res.json(rows);
});

// GET /bible-characters?difficulty=easy
router.get('/bible-characters', async (req, res) => {
  const { difficulty } = req.query;
  const query = difficulty
    ? ['SELECT * FROM bible_characters WHERE difficulty = ?', [difficulty]]
    : ['SELECT * FROM bible_characters', []];
  const [rows] = await pool.query(...query);
  res.json(rows);
});

module.exports = router;
