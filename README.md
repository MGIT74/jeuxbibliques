# Jeux Bibliques

Application de mini-jeux bibliques (quiz, mots mêlés, memory, etc.) pour
enfants, ados et adultes.

**Stack** : React + Vite (frontend) + Node.js/Express + MySQL (backend),
le tout servi par **un seul processus** — comme n'importe quelle app
Node.js classique, pas de séparation front/back au déploiement.

## Structure

```
/                 → Frontend React (Vite)
  src/            → Composants, jeux, pages
  dist/           → Build de production (généré par `npm run build`)
api/              → Backend Express + MySQL
  src/
    server.js     → Point d'entrée : sert l'API (/api/*) ET les fichiers
                    statiques du frontend (dist/), avec fallback SPA
    db/           → Schéma SQL, scripts migrate/seed
    routes/       → Auth, jeux, scores, bannières, admin...
    middleware/   → Authentification JWT
```

## Installation locale

```bash
# 1. Dépendances frontend
npm install

# 2. Dépendances backend
npm --prefix api install

# 3. Config
cp .env.example .env   # renseigner DB_*, JWT_SECRET

# 4. Base de données (MySQL/MariaDB doit tourner)
npm --prefix api run migrate
npm --prefix api run seed      # charge le contenu : jeux, versets, questions...

# 5. Build du frontend
npm run build

# 6. Démarrage
npm --prefix api start
```

L'app tourne alors sur `http://localhost:3000` (frontend + API réunis).

Compte admin créé automatiquement par le seed :
`admin@jeuxbibliques.local` / `change-me-please` — **à changer en prod**.

## Déploiement (xCloud ou équivalent)

Un seul site **Node.js**, mode de service **Hybrid (static + API)** :

- **Install command** : `npm install && npm run build && npm --prefix api install`
- **Start command** : `npm --prefix api start`
- **Port** : celui défini dans `PORT` (3000 par défaut)
- **Base de données** : MySQL, identifiants dans le `.env` du site
- Après le premier déploiement, lancer une fois :
  ```bash
  npm --prefix api run migrate
  npm --prefix api run seed
  ```

Le seed est idempotent : sûr à relancer sans dupliquer le contenu.

## Routes API principales

- `POST /api/register`, `POST /api/login`, `GET /api/me`, `PUT /api/me`
- `GET /api/games`, `/api/verses`, `/api/quiz-questions`, `/api/bible-words`, `/api/bible-characters`
- `POST /api/scores`, `GET /api/scores`, `GET /api/progress`
- `GET /api/banners`, `GET /api/donation-settings`, `GET /api/online-users`
- `GET/POST/PUT/DELETE /api/admin/*` (protégées, réservées aux administrateurs)
