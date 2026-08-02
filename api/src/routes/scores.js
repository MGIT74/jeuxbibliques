const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /scores — historique du joueur connecté
router.get('/scores', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.*, g.name as game_name, g.slug as game_slug
     FROM scores s JOIN games g ON g.id = s.game_id
     WHERE s.user_id = ? ORDER BY s.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// POST /scores — reproduit la logique de l'ancien hook useScore.ts, côté serveur
router.post('/scores', requireAuth, async (req, res) => {
  const { game_slug, score, max_score, difficulty, time_spent } = req.body;

  if (!game_slug || score == null || !max_score || !difficulty || time_spent == null) {
    return res.status(422).json({ message: 'Champs manquants (game_slug, score, max_score, difficulty, time_spent).' });
  }
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(422).json({ message: 'difficulty invalide.' });
  }
  // Le client calcule son propre score localement (pas de "vraie" verification
  // serveur possible sans rejouer la partie), mais on rejette au moins les
  // valeurs incoherentes qui pourraient fausser le classement ou planter le
  // calcul de points (division par zero, score negatif, score > max_score).
  if (
    typeof score !== 'number' || typeof max_score !== 'number' ||
    score < 0 || max_score <= 0 || score > max_score ||
    !Number.isFinite(score) || !Number.isFinite(max_score)
  ) {
    return res.status(422).json({ message: 'score/max_score invalides.' });
  }

  const [games] = await pool.query('SELECT id FROM games WHERE slug = ?', [game_slug]);
  if (games.length === 0) {
    return res.status(404).json({ message: 'Jeu introuvable.' });
  }
  const gameId = games[0].id;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const scoreId = uuidv4();
    await conn.query(
      `INSERT INTO scores (id, user_id, game_id, score, max_score, difficulty, time_spent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [scoreId, req.user.id, gameId, score, max_score, difficulty, time_spent]
    );

    const [existing] = await conn.query(
      'SELECT * FROM progress WHERE user_id = ? AND game_id = ?',
      [req.user.id, gameId]
    );

    if (existing.length > 0) {
      const p = existing[0];
      await conn.query(
        `UPDATE progress SET games_played = games_played + 1, best_score = GREATEST(best_score, ?), last_played_at = NOW()
         WHERE id = ?`,
        [score, p.id]
      );
    } else {
      await conn.query(
        `INSERT INTO progress (id, user_id, game_id, games_played, best_score) VALUES (?, ?, ?, 1, ?)`,
        [uuidv4(), req.user.id, gameId, score]
      );
    }

    const multiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
    const pointsEarned = Math.round((score / max_score) * 10 * multiplier);
    await conn.query('UPDATE users SET total_points = total_points + ? WHERE id = ?', [pointsEarned, req.user.id]);

    await conn.commit();

    const [scoreRows] = await pool.query(
      `SELECT s.*, g.name as game_name FROM scores s JOIN games g ON g.id = s.game_id WHERE s.id = ?`,
      [scoreId]
    );
    res.status(201).json(scoreRows[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// GET /progress — progression du joueur connecté sur tous les jeux
router.get('/progress', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, g.name as game_name, g.slug as game_slug
     FROM progress p JOIN games g ON g.id = p.game_id
     WHERE p.user_id = ?`,
    [req.user.id]
  );
  res.json(rows);
});

module.exports = router;
