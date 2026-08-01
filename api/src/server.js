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
const adminRoutes = require('./routes/admin');

const app = express();

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
}));

app.use(express.json());

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
app.use('/api', adminRoutes);

// --- Frontend React (build Vite) servi depuis le même site, comme l'app "salon" ---
// api/src/server.js -> ../../dist = dist/ à la racine du repo
const frontendDist = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(frontendDist));

// Fallback SPA : toute route qui n'est ni /api/* ni /uploads/* renvoie index.html
app.get(/^(?!\/api|\/uploads).*/, (req, res, next) => {
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// Gestion d'erreurs générique
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur.' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Jeux Bibliques API listening on port ${port}`);
});
