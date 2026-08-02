const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function sanitize(user) {
  const { password, ...rest } = user;
  return rest;
}

// GET /admin/users
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(rows.map(sanitize));
});

// GET /admin/users/marketing
router.get('/admin/users/marketing', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, username, email, full_name, newsletter_consent, marketing_consent, consent_date, created_at
     FROM users WHERE newsletter_consent = 1 OR marketing_consent = 1`
  );
  res.json(rows);
});

// POST /admin/users/:id/block
router.post('/admin/users/:id/block', requireAuth, requireAdmin, async (req, res) => {
  const { reason } = req.body;
  await pool.query(
    'UPDATE users SET is_blocked = 1, blocked_at = NOW(), blocked_reason = ? WHERE id = ?',
    [reason || null, req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
  res.json(sanitize(rows[0]));
});

// POST /admin/users/:id/unblock
router.post('/admin/users/:id/unblock', requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    'UPDATE users SET is_blocked = 0, blocked_at = NULL, blocked_reason = NULL WHERE id = ?',
    [req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
  res.json(sanitize(rows[0]));
});

// DELETE /admin/users/:id
router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(422).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
  }
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'Utilisateur supprimé.' });
});

// --- Statistiques ---

// GET /admin/stats/overview
router.get('/admin/stats/overview', requireAuth, requireAdmin, async (req, res) => {
  const [[{ total_users }]] = await pool.query('SELECT COUNT(*) as total_users FROM users');
  const [[{ new_users_week }]] = await pool.query(
    'SELECT COUNT(*) as new_users_week FROM users WHERE created_at >= (NOW() - INTERVAL 7 DAY)'
  );
  const [[{ new_users_month }]] = await pool.query(
    'SELECT COUNT(*) as new_users_month FROM users WHERE created_at >= (NOW() - INTERVAL 30 DAY)'
  );
  const [[{ total_games_played }]] = await pool.query('SELECT COUNT(*) as total_games_played FROM scores');
  const [[{ games_played_week }]] = await pool.query(
    'SELECT COUNT(*) as games_played_week FROM scores WHERE created_at >= (NOW() - INTERVAL 7 DAY)'
  );
  const [[{ total_points_earned }]] = await pool.query(
    'SELECT COALESCE(SUM(total_points), 0) as total_points_earned FROM users'
  );
  const [[{ avg_score_percentage }]] = await pool.query(
    'SELECT COALESCE(AVG(score / NULLIF(max_score, 0) * 100), 0) as avg_score_percentage FROM scores'
  );

  res.json({
    total_users,
    new_users_week,
    new_users_month,
    total_games_played,
    games_played_week,
    total_points_earned: Number(total_points_earned),
    avg_score_percentage: Math.round(avg_score_percentage),
  });
});

// GET /admin/stats/by-game
router.get('/admin/stats/by-game', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.*, COUNT(s.id) as total_plays,
       COALESCE(AVG(s.score / NULLIF(s.max_score, 0) * 100), 0) as avg_score
     FROM games g LEFT JOIN scores s ON s.game_id = g.id
     GROUP BY g.id ORDER BY total_plays DESC`
  );

  res.json(rows.map((row) => ({
    game: {
      id: row.id, slug: row.slug, name: row.name, description: row.description,
      icon: row.icon, color: row.color, cover_image_url: row.cover_image_url, min_age: row.min_age,
      difficulty_levels: typeof row.difficulty_levels === 'string' ? JSON.parse(row.difficulty_levels) : row.difficulty_levels,
    },
    total_plays: Number(row.total_plays),
    avg_score: Math.round(Number(row.avg_score)),
  })));
});

// GET /admin/stats/recent-scores
router.get('/admin/stats/recent-scores', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.id, s.user_id, s.game_id, s.score, s.max_score, s.difficulty, s.created_at,
       COALESCE(u.username, 'Inconnu') as username, COALESCE(g.name, 'Inconnu') as game_name
     FROM scores s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN games g ON g.id = s.game_id
     ORDER BY s.created_at DESC LIMIT 100`
  );
  res.json(rows);
});

// --- Edition des jeux (nom, description, image de couverture) ---

router.put('/admin/games/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, cover_image_url } = req.body;

  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (cover_image_url !== undefined) { fields.push('cover_image_url = ?'); values.push(cover_image_url || null); }

  if (fields.length === 0) {
    return res.status(422).json({ message: 'Aucun champ à mettre à jour.' });
  }

  values.push(req.params.id);
  await pool.query(`UPDATE games SET ${fields.join(', ')} WHERE id = ?`, values);

  const [rows] = await pool.query('SELECT * FROM games WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Jeu introuvable.' });
  res.json(rows[0]);
});

module.exports = router;
