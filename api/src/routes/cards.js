const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /cards — catalogue public des cartes actives (nom/description/image),
// sans info de possession : sert a afficher les cartes pas encore debloquees
// (silhouette) meme a un visiteur non connecte, comme un teaser de collection.
router.get('/cards', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, description, image_url, points_threshold, hearts_reward FROM cards WHERE is_active = 1 ORDER BY points_threshold ASC'
  );
  res.json(rows);
});

// GET /my-cards — cartes possedees par l'utilisateur connecte + solde de coeurs
router.get('/my-cards', requireAuth, async (req, res) => {
  const [owned] = await pool.query(
    `SELECT c.id, c.name, c.description, c.image_url, c.points_threshold, c.hearts_reward,
            uc.unlocked_at, uc.seen
     FROM user_cards uc JOIN cards c ON c.id = uc.card_id
     WHERE uc.user_id = ? ORDER BY uc.unlocked_at DESC`,
    [req.user.id]
  );
  res.json({ hearts: req.user.hearts, cards: owned });
});

// POST /my-cards/:cardId/seen — marque une carte comme deja vue (apres
// l'animation de revelation), pour ne pas la re-declencher a chaque visite.
router.post('/my-cards/:cardId/seen', requireAuth, async (req, res) => {
  await pool.query(
    'UPDATE user_cards SET seen = 1 WHERE user_id = ? AND card_id = ?',
    [req.user.id, req.params.cardId]
  );
  res.json({ message: 'ok' });
});

// POST /hearts/use — consomme un coeur (utilise pour reveler une lettre dans
// Devine le Mot). Renvoie le nouveau solde, ou une erreur si aucun coeur.
router.post('/hearts/use', requireAuth, async (req, res) => {
  const [result] = await pool.query(
    'UPDATE users SET hearts = hearts - 1 WHERE id = ? AND hearts > 0',
    [req.user.id]
  );
  if (result.affectedRows === 0) {
    return res.status(422).json({ message: "Aucun cœur disponible." });
  }
  const [[{ hearts }]] = await pool.query('SELECT hearts FROM users WHERE id = ?', [req.user.id]);
  res.json({ hearts });
});

// --- Admin ---

router.get('/admin/cards', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM cards ORDER BY points_threshold ASC');
  res.json(rows);
});

router.post('/admin/cards', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, image_url, points_threshold, hearts_reward, is_active, display_order } = req.body;

  if (!name || points_threshold == null) {
    return res.status(422).json({ message: 'name et points_threshold sont requis.' });
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO cards (id, name, description, image_url, points_threshold, hearts_reward, is_active, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, description || null, image_url || null, points_threshold,
      hearts_reward ?? 1, is_active === undefined ? true : !!is_active, display_order || 0]
  );

  const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

router.put('/admin/cards/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, image_url, points_threshold, hearts_reward, is_active, display_order } = req.body;

  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description || null); }
  if (image_url !== undefined) { fields.push('image_url = ?'); values.push(image_url || null); }
  if (points_threshold !== undefined) { fields.push('points_threshold = ?'); values.push(points_threshold); }
  if (hearts_reward !== undefined) { fields.push('hearts_reward = ?'); values.push(hearts_reward); }
  if (is_active !== undefined) { fields.push('is_active = ?'); values.push(!!is_active); }
  if (display_order !== undefined) { fields.push('display_order = ?'); values.push(display_order); }

  if (fields.length === 0) {
    return res.status(422).json({ message: 'Aucun champ à mettre à jour.' });
  }

  values.push(req.params.id);
  await pool.query(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`, values);

  const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Carte introuvable.' });
  res.json(rows[0]);
});

router.post('/admin/cards/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  await pool.query('UPDATE cards SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Carte introuvable.' });
  res.json(rows[0]);
});

router.delete('/admin/cards/:id', requireAuth, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM cards WHERE id = ?', [req.params.id]);
  res.json({ message: 'Carte supprimée.' });
});

module.exports = router;
