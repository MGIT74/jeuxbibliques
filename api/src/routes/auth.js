const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const { sendMail, getSmtpSettings } = require('../lib/mailer');

const router = express.Router();

// Protection contre le bourrage d'identifiants / force brute : 10 tentatives
// par IP toutes les 15 minutes sur les routes sensibles (login, inscription,
// renvoi de verification). Les tentatives reussies ne sont pas comptees.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '90d' });
}

function sanitize(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

// POST /register
router.post('/register', authLimiter, async (req, res) => {
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
  const verificationToken = uuidv4();
  const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  await pool.query(
    `INSERT INTO users (id, email, password, username, church_name, age_group, total_points, is_admin, newsletter_consent, marketing_consent, is_blocked, verification_token, verification_token_expires)
     VALUES (?, ?, ?, ?, ?, 'adult', 0, 0, 0, 0, 0, ?, ?)`,
    [id, normalizedEmail, passwordHash, username.trim(), church_name ? church_name.trim() : null, verificationToken, verificationExpires]
  );

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  const token = signToken(id);

  // Email de bienvenue / verification — n'empeche jamais l'inscription de
  // reussir si le SMTP n'est pas configure ou echoue (voir sendMail).
  const smtp = await getSmtpSettings();
  if (smtp && smtp.is_active) {
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const verifyLink = `${appUrl}/verifier-email?token=${verificationToken}`;
    sendMail({
      to: normalizedEmail,
      subject: 'Bienvenue sur Jeux Bibliques — vérifie ton email',
      html: `
        <p>Bonjour ${username.trim()},</p>
        <p>Merci de t'être inscrit(e) sur Jeux Bibliques !</p>
        <p><a href="${verifyLink}">Clique ici pour vérifier ton adresse email</a> (lien valable 48h).</p>
        <p>Si tu n'es pas à l'origine de cette inscription, tu peux ignorer ce message.</p>
      `,
    }).catch((err) => console.error('Erreur envoi email inscription:', err));
  }

  res.status(201).json({ user: sanitize(rows[0]), token });
});

// POST /login
router.post('/login', authLimiter, async (req, res) => {
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

// GET /verify-email?token=... — appele par le lien envoye par email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(422).json({ message: 'Token manquant.' });

  const [rows] = await pool.query(
    'SELECT id, verification_token_expires FROM users WHERE verification_token = ?',
    [token]
  );
  const user = rows[0];

  if (!user) {
    return res.status(404).json({ message: 'Lien de vérification invalide.' });
  }
  if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
    return res.status(410).json({ message: 'Ce lien de vérification a expiré.' });
  }

  await pool.query(
    'UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
    [user.id]
  );

  res.json({ message: 'Email vérifié avec succès.' });
});

// POST /resend-verification — renvoie un email de verification (utilisateur connecte)
router.post('/resend-verification', requireAuth, authLimiter, async (req, res) => {
  if (req.user.email_verified) {
    return res.json({ message: 'Cet email est déjà vérifié.' });
  }

  const smtp = await getSmtpSettings();
  if (!smtp || !smtp.is_active) {
    return res.status(422).json({ message: "L'envoi d'email n'est pas configuré pour le moment." });
  }

  const verificationToken = uuidv4();
  const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await pool.query(
    'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
    [verificationToken, verificationExpires, req.user.id]
  );

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const verifyLink = `${appUrl}/verifier-email?token=${verificationToken}`;
  await sendMail({
    to: req.user.email,
    subject: 'Vérifie ton email — Jeux Bibliques',
    html: `<p><a href="${verifyLink}">Clique ici pour vérifier ton adresse email</a> (lien valable 48h).</p>`,
  });

  res.json({ message: 'Email de vérification renvoyé.' });
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

// POST /change-email — necessite le mot de passe actuel pour confirmer
router.post('/change-email', requireAuth, authLimiter, async (req, res) => {
  const { new_email, current_password } = req.body;
  if (!new_email || !current_password) {
    return res.status(422).json({ message: 'new_email et current_password sont requis.' });
  }

  const validPassword = await bcrypt.compare(current_password, req.user.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
  }

  const normalizedEmail = new_email.toLowerCase().trim();
  if (normalizedEmail === req.user.email) {
    return res.status(422).json({ message: 'Cette adresse est déjà celle de ton compte.' });
  }
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [normalizedEmail, req.user.id]);
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre compte.' });
  }

  const oldEmail = req.user.email;
  const verificationToken = uuidv4();
  const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await pool.query(
    'UPDATE users SET email = ?, email_verified = 0, verification_token = ?, verification_token_expires = ? WHERE id = ?',
    [normalizedEmail, verificationToken, verificationExpires, req.user.id]
  );

  // Notifications de securite : on previent l'ANCIENNE adresse au cas ou ce
  // changement n'etait pas voulu, et on envoie un lien de verification a la
  // NOUVELLE adresse (n'empechent jamais la reponse de reussir si l'email echoue).
  const smtp = await getSmtpSettings();
  if (smtp && smtp.is_active) {
    if (oldEmail) {
      sendMail({
        to: oldEmail,
        subject: 'Ton email de connexion a été modifié — Jeux Bibliques',
        html: `
          <p>Bonjour ${req.user.username || ''},</p>
          <p>L'adresse email de ton compte Jeux Bibliques vient d'être changée vers <strong>${normalizedEmail}</strong>.</p>
          <p>Si tu n'es pas à l'origine de cette modification, contacte un administrateur immédiatement.</p>
        `,
      }).catch((err) => console.error('Erreur envoi email (ancienne adresse):', err));
    }

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const verifyLink = `${appUrl}/verifier-email?token=${verificationToken}`;
    sendMail({
      to: normalizedEmail,
      subject: 'Confirme ta nouvelle adresse email — Jeux Bibliques',
      html: `
        <p>Bonjour ${req.user.username || ''},</p>
        <p>Ton compte Jeux Bibliques utilise maintenant cette adresse email.</p>
        <p><a href="${verifyLink}">Clique ici pour la vérifier</a> (lien valable 48h).</p>
      `,
    }).catch((err) => console.error('Erreur envoi email (nouvelle adresse):', err));
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json(sanitize(rows[0]));
});

// POST /change-password — necessite le mot de passe actuel pour confirmer
router.post('/change-password', requireAuth, authLimiter, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(422).json({ message: 'current_password et new_password sont requis.' });
  }
  if (new_password.length < 8) {
    return res.status(422).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
  }

  const validPassword = await bcrypt.compare(current_password, req.user.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
  }

  const newHash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [newHash, req.user.id]);

  const smtp = await getSmtpSettings();
  if (smtp && smtp.is_active && req.user.email) {
    sendMail({
      to: req.user.email,
      subject: 'Ton mot de passe a été modifié — Jeux Bibliques',
      html: `
        <p>Bonjour ${req.user.username || ''},</p>
        <p>Le mot de passe de ton compte Jeux Bibliques vient d'être modifié.</p>
        <p>Si tu n'es pas à l'origine de cette modification, contacte un administrateur immédiatement.</p>
      `,
    }).catch((err) => console.error('Erreur envoi email confirmation mot de passe:', err));
  }

  res.json({ message: 'Mot de passe modifié avec succès.' });
});

// POST /forgot-password — envoie un lien de reinitialisation par email.
// Repond toujours de la meme facon, que l'email existe ou non, pour ne pas
// reveler quels emails sont enregistres (enumeration).
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  const generic = { message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." };

  if (!email) return res.status(422).json({ message: 'email est requis.' });

  const normalizedEmail = email.toLowerCase().trim();
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
  const user = rows[0];

  if (!user) return res.json(generic);

  const smtp = await getSmtpSettings();
  if (!smtp || !smtp.is_active) {
    // On le signale honnetement a l'appelant plutot que de faire croire
    // qu'un email a ete envoye alors que le SMTP n'est pas configure.
    return res.status(422).json({ message: "L'envoi d'email n'est pas configuré pour le moment. Contacte un administrateur." });
  }

  const resetToken = uuidv4();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await pool.query(
    'UPDATE users SET password_reset_token = ?, password_reset_token_expires = ? WHERE id = ?',
    [resetToken, resetExpires, user.id]
  );

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const resetLink = `${appUrl}/reinitialiser-mot-de-passe?token=${resetToken}`;
  sendMail({
    to: normalizedEmail,
    subject: 'Réinitialisation de ton mot de passe — Jeux Bibliques',
    html: `
      <p>Bonjour ${user.username || ''},</p>
      <p>Tu as demandé à réinitialiser ton mot de passe.</p>
      <p><a href="${resetLink}">Clique ici pour choisir un nouveau mot de passe</a> (lien valable 1h).</p>
      <p>Si tu n'es pas à l'origine de cette demande, tu peux ignorer ce message.</p>
    `,
  }).catch((err) => console.error('Erreur envoi email reinitialisation:', err));

  res.json(generic);
});

// POST /reset-password — pose le nouveau mot de passe a partir du token recu par email
router.post('/reset-password', authLimiter, async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(422).json({ message: 'token et new_password sont requis.' });
  }
  if (new_password.length < 8) {
    return res.status(422).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
  }

  const [rows] = await pool.query(
    'SELECT id, password_reset_token_expires FROM users WHERE password_reset_token = ?',
    [token]
  );
  const user = rows[0];

  if (!user) {
    return res.status(404).json({ message: 'Lien de réinitialisation invalide.' });
  }
  if (user.password_reset_token_expires && new Date(user.password_reset_token_expires) < new Date()) {
    return res.status(410).json({ message: 'Ce lien de réinitialisation a expiré.' });
  }

  const newHash = await bcrypt.hash(new_password, 10);
  await pool.query(
    'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_token_expires = NULL WHERE id = ?',
    [newHash, user.id]
  );

  res.json({ message: 'Mot de passe réinitialisé avec succès. Tu peux maintenant te connecter.' });
});

module.exports = router;
