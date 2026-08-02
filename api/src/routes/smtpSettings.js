const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendMail, buildTransport } = require('../lib/mailer');

const router = express.Router();

// GET /admin/smtp-settings — le mot de passe n'est jamais renvoye tel quel,
// seulement un indicateur "has_password" (comme un champ de mot de passe
// qu'on ne veut pas reafficher en clair dans l'admin).
router.get('/admin/smtp-settings', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM smtp_settings LIMIT 1');
  const settings = rows[0] || null;
  if (!settings) return res.json(null);

  const { password, ...safe } = settings;
  res.json({ ...safe, has_password: !!password });
});

router.put('/admin/smtp-settings', requireAuth, requireAdmin, async (req, res) => {
  const {
    host, port, secure, username, password,
    from_email, from_name, is_active, require_email_verification,
  } = req.body;

  const [existing] = await pool.query('SELECT * FROM smtp_settings LIMIT 1');

  if (existing.length > 0) {
    const fields = [];
    const values = [];
    if (host !== undefined) { fields.push('host = ?'); values.push(host || null); }
    if (port !== undefined) { fields.push('port = ?'); values.push(port || 587); }
    if (secure !== undefined) { fields.push('secure = ?'); values.push(!!secure); }
    if (username !== undefined) { fields.push('username = ?'); values.push(username || null); }
    // On ne remplace le mot de passe que si un nouveau est envoye (non vide) :
    // ca permet a l'admin de modifier les autres champs sans le ressaisir.
    if (password) { fields.push('password = ?'); values.push(password); }
    if (from_email !== undefined) { fields.push('from_email = ?'); values.push(from_email || null); }
    if (from_name !== undefined) { fields.push('from_name = ?'); values.push(from_name || null); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(!!is_active); }
    if (require_email_verification !== undefined) {
      fields.push('require_email_verification = ?');
      values.push(!!require_email_verification);
    }
    fields.push('updated_by = ?');
    values.push(req.user.id, existing[0].id);

    await pool.query(`UPDATE smtp_settings SET ${fields.join(', ')} WHERE id = ?`, values);
  } else {
    await pool.query(
      `INSERT INTO smtp_settings
        (id, host, port, secure, username, password, from_email, from_name, is_active, require_email_verification, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), host || null, port || 587, !!secure, username || null, password || null,
        from_email || null, from_name || null, !!is_active, !!require_email_verification, req.user.id,
      ]
    );
  }

  const [rows] = await pool.query('SELECT * FROM smtp_settings LIMIT 1');
  const { password: _pw, ...safe } = rows[0];
  res.json({ ...safe, has_password: !!_pw });
});

// POST /admin/smtp-settings/test — envoie un email de test a l'admin connecte,
// pour verifier la config sans devoir passer par une vraie inscription.
router.post('/admin/smtp-settings/test', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM smtp_settings LIMIT 1');
  const settings = rows[0];

  if (!settings || !settings.host) {
    return res.status(422).json({ message: 'Configure d\'abord un serveur SMTP.' });
  }

  try {
    const transport = buildTransport(settings);
    await transport.verify();
    await sendMail({
      to: req.user.email,
      subject: 'Test SMTP — Jeux Bibliques',
      html: '<p>Ce message confirme que la configuration SMTP de Jeux Bibliques fonctionne correctement.</p>',
    });
    res.json({ message: `Email de test envoye a ${req.user.email}.` });
  } catch (err) {
    res.status(422).json({ message: `Echec de connexion SMTP : ${err.message}` });
  }
});

module.exports = router;
