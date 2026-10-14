const express = require('express');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Limite raisonnable pour eviter qu'un script ne vienne gonfler
// artificiellement les statistiques de clics.
const clickLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Le navigateur envoie des dates ISO ("2026-10-14T05:59:00.000Z") que MySQL
// refuse dans une colonne DATETIME : on les convertit en "YYYY-MM-DD HH:MM:SS"
// (UTC). Renvoie null si vide, undefined si la date est invalide.
function toMysqlDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 19).replace('T', ' ');
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

// POST /banners/:id/click — comptabilise un clic (public, meme pour un
// visiteur non connecte : les pubs sont visibles de tous). Volontairement
// silencieux sur les erreurs : un souci de tracking ne doit jamais bloquer
// la redirection vers le lien de la bannière cote utilisateur.
// Le compteur cumule (rapide a lire), et chaque clic est aussi loggue avec
// son horodatage dans banner_clicks (pour le filtre jour/semaine/mois).
router.post('/banners/:id/click', clickLimiter, async (req, res) => {
  await pool.query('UPDATE banners SET click_count = click_count + 1 WHERE id = ?', [req.params.id]);
  await pool.query(
    'INSERT INTO banner_clicks (id, banner_id, created_at) VALUES (?, ?, UTC_TIMESTAMP())',
    [uuidv4(), req.params.id]
  );
  res.json({ message: 'ok' });
});

// --- Admin ---
// L'image est envoyee directement en base64 dans image_url (data:image/...)
// depuis le navigateur : plus de fichier, plus d'upload separe, plus de
// dependance a multer — le formulaire d'ajout/modification suffit.

router.get('/admin/banners', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM banners ORDER BY display_order ASC');
  res.json(rows.map(r => withIsoDates(fixBannerUrl(r, req))));
});

// GET /admin/banners/stats?period=day|week|month&date=YYYY-MM-DD
// Renvoie le nombre de clics par banniere sur la periode demandee, ainsi
// que les bornes de la periode (pour afficher "1 - 7 aout 2026" etc. et
// permettre au front de naviguer avant/apres).
router.get('/admin/banners/stats', requireAuth, requireAdmin, async (req, res) => {
  const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'day';
  const refDate = req.query.date ? new Date(`${req.query.date}T00:00:00Z`) : new Date();
  if (isNaN(refDate.getTime())) {
    return res.status(422).json({ message: 'Date invalide.' });
  }

  let start, end;
  if (period === 'day') {
    start = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate()));
    end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  } else if (period === 'week') {
    // Semaine du lundi au dimanche.
    const day = refDate.getUTCDay(); // 0 = dimanche
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate() + diffToMonday));
    end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    start = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), 1));
    end = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() + 1, 1));
  }

  const [rows] = await pool.query(
    `SELECT b.id, b.title, COUNT(bc.id) as clicks
     FROM banners b
     LEFT JOIN banner_clicks bc ON bc.banner_id = b.id AND bc.created_at >= ? AND bc.created_at < ?
     GROUP BY b.id
     ORDER BY clicks DESC, b.display_order ASC`,
    [start, end]
  );

  const banners = rows.map((r) => ({ id: r.id, title: r.title, clicks: Number(r.clicks) }));
  res.json({
    period,
    start: start.toISOString(),
    end: end.toISOString(),
    total: banners.reduce((sum, b) => sum + b.clicks, 0),
    banners,
  });
});

router.post('/admin/banners', requireAuth, requireAdmin, async (req, res) => {
  const { title, image_url, link_url, is_active, display_order, duration_seconds, start_date, end_date } = req.body;

  if (!title || !image_url) {
    return res.status(422).json({ message: 'title et image_url sont requis.' });
  }
  const startMy = toMysqlDate(start_date);
  const endMy = toMysqlDate(end_date);
  if (startMy === undefined || endMy === undefined) {
    return res.status(422).json({ message: 'Date de diffusion invalide.' });
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO banners (id, title, image_url, link_url, is_active, display_order, duration_seconds, start_date, end_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, image_url, link_url || null, !!is_active, display_order || 0, duration_seconds || 5, startMy, endMy, req.user.id]
  );

  const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
  res.status(201).json(withIsoDates(rows[0]));
});

router.put('/admin/banners/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, image_url, link_url, is_active, display_order, duration_seconds, start_date, end_date } = req.body;

  if (!title || !image_url) {
    return res.status(422).json({ message: 'title et image_url sont requis.' });
  }
  const startMy = toMysqlDate(start_date);
  const endMy = toMysqlDate(end_date);
  if (startMy === undefined || endMy === undefined) {
    return res.status(422).json({ message: 'Date de diffusion invalide.' });
  }

  await pool.query(
    `UPDATE banners SET title = ?, image_url = ?, link_url = ?, is_active = ?, display_order = ?,
       duration_seconds = ?, start_date = ?, end_date = ?
     WHERE id = ?`,
    [title, image_url, link_url || null, !!is_active, display_order || 0, duration_seconds || 5, startMy, endMy, req.params.id]
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
