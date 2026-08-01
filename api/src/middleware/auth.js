const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET manquant dans .env');
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [payload.sub]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }
    if (user.is_blocked) {
      return res.status(403).json({ message: 'Ce compte a été bloqué.', reason: user.blocked_reason });
    }

    // Suivi de présence pour le compteur "en ligne" (remplace la presence Supabase Realtime)
    pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [user.id]).catch(() => {});

    delete user.password;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, JWT_SECRET };
