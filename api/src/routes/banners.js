const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'banners');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo, comme côté frontend
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Le fichier doit être une image.'));
    }
    cb(null, true);
  },
});

// GET /banners — bannières actives, dans leur fenêtre de diffusion (public)
router.get('/banners', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM banners
     WHERE is_active = 1
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date IS NULL OR end_date >= NOW())
     ORDER BY display_order ASC`
  );
  res.json(rows);
});

// --- Admin ---

router.get('/admin/banners', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM banners ORDER BY display_order ASC');
  res.json(rows);
});

router.post('/admin/banners', requireAuth, requireAdmin, async (req, res) => {
  const { title, image_url, link_url, is_active, display_order, duration_seconds, start_date, end_date } = req.body;

  if (!title || !image_url) {
    return res.status(422).json({ message: 'title et image_url sont requis.' });
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO banners (id, title, image_url, link_url, is_active, display_order, duration_seconds, start_date, end_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, image_url, link_url || null, !!is_active, display_order || 0, duration_seconds || 5, start_date || null, end_date || null, req.user.id]
  );

  const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

router.put('/admin/banners/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, image_url, link_url, is_active, display_order, duration_seconds, start_date, end_date } = req.body;

  await pool.query(
    `UPDATE banners SET title = ?, image_url = ?, link_url = ?, is_active = ?, display_order = ?,
       duration_seconds = ?, start_date = ?, end_date = ?
     WHERE id = ?`,
    [title, image_url, link_url || null, !!is_active, display_order || 0, duration_seconds || 5, start_date || null, end_date || null, req.params.id]
  );

  const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Bannière introuvable.' });
  res.json(rows[0]);
});

router.post('/admin/banners/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  await pool.query('UPDATE banners SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Bannière introuvable.' });
  res.json(rows[0]);
});

router.delete('/admin/banners/:id', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT image_url FROM banners WHERE id = ?', [req.params.id]);
  if (rows.length > 0) {
    const imageUrl = rows[0].image_url;
    if (imageUrl && imageUrl.includes('/uploads/banners/')) {
      const filename = imageUrl.split('/uploads/banners/')[1];
      const filePath = path.join(uploadDir, filename);
      fs.unlink(filePath, () => {});
    }
  }
  await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
  res.json({ message: 'Bannière supprimée.' });
});

router.post('/admin/banners/upload', requireAuth, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(422).json({ message: 'Aucun fichier reçu.' });

  const url = `${process.env.APP_URL}/uploads/banners/${req.file.filename}`;
  res.json({ path: `uploads/banners/${req.file.filename}`, url });
});

module.exports = router;
