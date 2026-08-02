const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Anciennes bannieres uploadees sur disque (avant simplification) : encore
// servies depuis /uploads pour ne pas casser les liens existants.
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'banners');
fs.mkdirSync(uploadDir, { recursive: true });

// Certaines bannieres tres anciennes peuvent avoir ete enregistrees avec
// "undefined/uploads/..." a cause d'un bug depuis corrige (APP_URL absent).
// On corrige l'URL a la volee, sans avoir besoin de toucher la base.
function fixBannerUrl(banner, req) {
  if (banner && typeof banner.image_url === 'string' && banner.image_url.startsWith('undefined/uploads/')) {
    const base = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    banner.image_url = banner.image_url.replace(/^undefined/, base);
  }
  return banner;
}

// Le pool MySQL renvoie des chaines de date brutes (dateStrings:true) sans
// fuseau horaire. On rajoute le "Z" pour que new Date(...) cote navigateur
// interprete toujours ces valeurs comme des instants UTC (le badge
// "Programmee/Expiree" de l'admin compare ces dates a l'heure locale du
// visiteur : sans ce "Z" chaque navigateur les lisait dans son propre
// fuseau, causant un decalage).
function toIsoUtc(mysqlDateString) {
  if (!mysqlDateString) return mysqlDateString;
  return mysqlDateString.replace(' ', 'T') + 'Z';
}

function withIsoDates(banner) {
  if (!banner) return banner;
  return {
    ...banner,
    start_date: toIsoUtc(banner.start_date),
    end_date: toIsoUtc(banner.end_date),
    created_at: toIsoUtc(banner.created_at),
    updated_at: toIsoUtc(banner.updated_at),
  };
}

// GET /banners — bannières actives, dans leur fenêtre de diffusion (public)
router.get('/banners', async (req, res) => {
  // UTC_TIMESTAMP() plutot que NOW() : le frontend envoie des dates
  // converties en UTC (toISOString()), donc la comparaison doit se faire
  // en UTC des deux cotes, independamment du fuseau horaire configure sur
  // le serveur MySQL.
  const [rows] = await pool.query(
    `SELECT * FROM banners
     WHERE is_active = 1
       AND (start_date IS NULL OR start_date <= UTC_TIMESTAMP())
       AND (end_date IS NULL OR end_date >= UTC_TIMESTAMP())
     ORDER BY display_order ASC`
  );
  res.json(rows.map(r => withIsoDates(fixBannerUrl(r, req))));
});

// --- Admin ---
// L'image est envoyee directement en base64 dans image_url (data:image/...)
// depuis le navigateur : plus de fichier, plus d'upload separe, plus de
// dependance a multer — le formulaire d'ajout/modification suffit.

router.get('/admin/banners', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM banners ORDER BY display_order ASC');
  res.json(rows.map(r => withIsoDates(fixBannerUrl(r, req))));
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
  res.status(201).json(withIsoDates(rows[0]));
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
  res.json(withIsoDates(rows[0]));
});

router.post('/admin/banners/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  await pool.query('UPDATE banners SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Bannière introuvable.' });
  res.json(withIsoDates(rows[0]));
});

router.delete('/admin/banners/:id', requireAuth, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
  res.json({ message: 'Bannière supprimée.' });
});

module.exports = router;
