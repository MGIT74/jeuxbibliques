const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /notifications — les 20 dernieres notifications actives (utilisateur connecte).
// Le "deja lu" est gere cote client (horodatage en localStorage) : pas besoin
// d'une table de suivi par utilisateur pour un simple systeme d'annonces.
router.get('/notifications', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, message, type, created_at FROM notifications
     WHERE is_active = 1
     ORDER BY created_at DESC
     LIMIT 20`
  );
  res.json(rows);
});

// --- Admin ---

router.get('/admin/notifications', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/admin/notifications', requireAuth, requireAdmin, async (req, res) => {
  const { title, message, type, is_active } = req.body;

  if (!title || !message) {
    return res.status(422).json({ message: 'title et message sont requis.' });
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO notifications (id, title, message, type, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, title, message, type || 'info', is_active === undefined ? true : !!is_active, req.user.id]
  );

  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

router.put('/admin/notifications/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, message, type, is_active } = req.body;

  await pool.query(
    'UPDATE notifications SET title = ?, message = ?, type = ?, is_active = ? WHERE id = ?',
    [title, message, type || 'info', !!is_active, req.params.id]
  );

  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Notification introuvable.' });
  res.json(rows[0]);
});

router.post('/admin/notifications/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  await pool.query('UPDATE notifications SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Notification introuvable.' });
  res.json(rows[0]);
});

router.delete('/admin/notifications/:id', requireAuth, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
  res.json({ message: 'Notification supprimée.' });
});

module.exports = router;
