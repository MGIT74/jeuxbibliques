require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

// Filet de sécurité : en Express 4, une exception dans une route async
// (ex. la base de données qui coupe un instant) ne serait pas rattrapée et
// ferait planter tout le processus Node. On log au lieu de crasher.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const scoreRoutes = require('./routes/scores');
const bannerRoutes = require('./routes/banners');
const donationSettingsRoutes = require('./routes/donationSettings');
const smtpSettingsRoutes = require('./routes/smtpSettings');
const notificationsRoutes = require('./routes/notifications');
const cardsRoutes = require('./routes/cards');
const adminRoutes = require('./routes/admin');
const { migrate } = require('./db/migrate');
const { seed } = require('./db/seed');

const app = express();

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
}));

app.use(express.json({ limit: '10mb' }));

// Fichiers uploadés (bannières) servis statiquement
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/status', (req, res) => {
  res.json({ name: 'Jeux Bibliques API', status: 'ok' });
});

app.use('/api', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', scoreRoutes);
app.use('/api', bannerRoutes);
app.use('/api', donationSettingsRoutes);
app.use('/api', smtpSettingsRoutes);
app.use('/api', notificationsRoutes);
app.use('/api', cardsRoutes);
app.use('/api', adminRoutes);

// --- Frontend React (build Vite) servi depuis le même site, comme l'app "salon" ---
// api/src/server.js -> ../../dist = dist/ à la racine du repo
const frontendDist = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(frontendDist, {
  // Les fichiers JS/CSS de Vite ont un hash dans leur nom (ex: index-abc123.js) :
  // on peut les mettre en cache longtemps sans risque, un nouveau build change le nom.
  // index.html en revanche ne doit JAMAIS être mis en cache par le navigateur,
  // sinon un déploiement peut sembler ne "rien changer" pour un visiteur récurrent.
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// Fallback SPA : toute route qui n'est ni /api/* ni /uploads/* renvoie index.html
app.get(/^(?!\/api|\/uploads).*/, (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// Gestion d'erreurs générique
app.use((err, req, res, next) => {
  console.error(err);
  // On ne renvoie jamais le detail technique (message SQL, chemins, etc.)
  // au client pour une erreur inattendue — seulement logue cote serveur.
  res.status(err.status || 500).json({ message: 'Erreur serveur.' });
});

const port = process.env.PORT || 3000;

// Migration automatique et idempotente au demarrage : cree/complete le
// schema (nouvelles tables, nouvelles colonnes) sans intervention manuelle
// a chaque deploiement. Sans danger a re-executer (CREATE TABLE IF NOT
// EXISTS + verification d'existence des colonnes).
migrate()
  .then(() => seed())
  .then(() => {
    app.listen(port, () => {
      console.log(`Jeux Bibliques API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Echec de la migration/synchronisation au demarrage:', err);
    // On demarre quand meme le serveur : mieux vaut un site fonctionnel
    // sans la derniere mise a jour de contenu qu'un site totalement hors ligne.
    app.listen(port, () => {
      console.log(`Jeux Bibliques API listening on port ${port} (sans migration/sync)`);
    });
  });
