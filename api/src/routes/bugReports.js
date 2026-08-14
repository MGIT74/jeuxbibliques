const express = require('express');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Limite raisonnable pour eviter le spam de signalements (chaque capture
// d'ecran en base64 peut peser plusieurs Mo).
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de signalements envoyés. Réessaie dans quelques minutes.' },
});

// POST /bug-reports — l'utilisateur connecte signale un bug. La description
// et la capture d'ecran sont toutes les deux obligatoires (verifie aussi
// cote client, mais on ne fait jamais confiance qu'au client).
router.post('/bug-reports', requireAuth, reportLimiter, async (req, res) => {
  const { description, screenshot_url, page_url } = req.body;

  if (!description || !description.trim()) {
    return res.status(422).json({ message: 'La description du bug est obligatoire.' });
  }
  if (description.trim().length > 3000) {
    return res.status(422).json({ message: 'La description est trop longue (3000 caractères max).' });
  }
  if (!screenshot_url) {
    return res.status(422).json({ message: 'Une capture d\'écran est obligatoire.' });
  }
  // Verifie que c'est bien une image encodee en base64 (data URI), pas
  // n'importe quel texte glisse dans ce champ.
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(screenshot_url)) {
    return res.status(422).json({ message: 'Format de capture d\'écran invalide.' });
  }
  // page_url est juste informatif : on le tronque par securite plutot que
  // de rejeter la requete pour un champ non-critique.
  const safePageUrl = page_url ? String(page_url).slice(0, 500) : null;

  const id = uuidv4();
  await pool.query(
    `INSERT INTO bug_reports (id, user_id, description, screenshot_url, page_url)
     VALUES (?, ?, ?, ?, ?)`,
    [id, req.user.id, description.trim(), screenshot_url, safePageUrl]
  );

  res.status(201).json({ message: 'Signalement envoyé, merci !' });
});

// --- Admin ---

router.get('/admin/bug-reports', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.*, COALESCE(u.username, 'Utilisateur supprimé') as username, u.email
     FROM bug_reports b LEFT JOIN users u ON u.id = b.user_id
     ORDER BY b.created_at DESC`
  );
  res.json(rows);
});

router.put('/admin/bug-reports/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['new', 'in_progress', 'resolved'].includes(status)) {
    return res.status(422).json({ message: 'Statut invalide.' });
  }
  await pool.query('UPDATE bug_reports SET status = ? WHERE id = ?', [status, req.params.id]);
  const [rows] = await pool.query('SELECT * FROM bug_reports WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Signalement introuvable.' });
  res.json(rows[0]);
});

router.delete('/admin/bug-reports/:id', requireAuth, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM bug_reports WHERE id = ?', [req.params.id]);
  res.json({ message: 'Signalement supprimé.' });
});

module.exports = router;
