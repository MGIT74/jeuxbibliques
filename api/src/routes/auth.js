const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '90d' });
}

function sanitize(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

// POST /register
router.post('/register', async (req, res) => {
  const { email, password, username, church_name } = req.body;

  if (!email || !password || !username) {
    return res.status(422).json({ errors: { message: 'email, password et username sont requis.' } });
  }
  if (password.length < 8) {
    return res.status(422).json({ errors: { password: ['Le mot de passe doit contenir au moins 8 caractères.'] } });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(422).json({ errors: { email: ['Cet email est déjà utilisé.'] } });
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (id, email, password, username, church_name, age_group, total_points, is_admin, newsletter_consent, marketing_consent, is_blocked)
     VALUES (?, ?, ?, ?, ?, 'adult', 0, 0, 0, 0, 0)`,
    [id, normalizedEmail, passwordHash, username.trim(), church_name ? church_name.trim() : null]
  );

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  const token = signToken(id);

  res.status(201).json({ user: sanitize(rows[0]), token });
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ errors: { message: 'email et password sont requis.' } });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Identifiants invalides.' });
  }

  if (user.is_blocked) {
    return res.status(403).json({ message: 'Ce compte a été bloqué.', reason: user.blocked_reason });
  }

  const token = signToken(user.id);
  res.json({ user: sanitize(user), token });
});

// POST /logout (côté JWT stateless : le client supprime juste son token)
router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'Déconnecté.' });
});

// GET /me
router.get('/me', requireAuth, (req, res) => {
  res.json(sanitize(req.user));
});

// PUT /me
router.put('/me', requireAuth, async (req, res) => {
  const allowed = [
    'username', 'avatar_url', 'age_group', 'full_name', 'church_name',
    'newsletter_consent', 'marketing_consent', 'country',
  ];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.json(sanitize(req.user));
  }

  const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, req.user.id]);

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json(sanitize(rows[0]));
});

module.exports = router;
