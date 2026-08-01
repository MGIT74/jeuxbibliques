const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /donation-settings — pour la page publique "Faire un don"
router.get('/donation-settings', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM donation_settings WHERE is_active = 1 LIMIT 1');
  res.json(rows[0] || null);
});

// GET /donation-settings/user-counter — indépendant de is_active (le compteur reste visible)
router.get('/donation-settings/user-counter', async (req, res) => {
  const [rows] = await pool.query('SELECT show_user_counter FROM donation_settings LIMIT 1');
  res.json({ show_user_counter: !!(rows[0] && rows[0].show_user_counter) });
});

// GET /online-users — remplace la presence Supabase Realtime par du polling
router.get('/online-users', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id as user_id, username, COALESCE(country, detected_country) as country, last_seen_at as online_at
     FROM users WHERE last_seen_at >= (NOW() - INTERVAL 2 MINUTE)`
  );
  res.json({ count: rows.length, users: rows });
});

// --- Admin ---

router.get('/admin/donation-settings', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM donation_settings LIMIT 1');
  res.json(rows[0] || null);
});

router.put('/admin/donation-settings', requireAuth, requireAdmin, async (req, res) => {
  const { iframe_code, is_active, show_user_counter } = req.body;
  const [existing] = await pool.query('SELECT id FROM donation_settings LIMIT 1');

  if (existing.length > 0) {
    const fields = [];
    const values = [];
    if (iframe_code !== undefined) { fields.push('iframe_code = ?'); values.push(iframe_code); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(!!is_active); }
    if (show_user_counter !== undefined) { fields.push('show_user_counter = ?'); values.push(!!show_user_counter); }
    fields.push('updated_by = ?');
    values.push(req.user.id, existing[0].id);

    await pool.query(`UPDATE donation_settings SET ${fields.join(', ')} WHERE id = ?`, values);
  } else {
    await pool.query(
      `INSERT INTO donation_settings (id, iframe_code, is_active, show_user_counter, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), iframe_code || null, !!is_active, !!show_user_counter, req.user.id]
    );
  }

  const [rows] = await pool.query('SELECT * FROM donation_settings LIMIT 1');
  res.json(rows[0]);
});

module.exports = router;
