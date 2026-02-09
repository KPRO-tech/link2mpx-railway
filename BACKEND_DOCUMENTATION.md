# Documentation complète du backend — Link2Mpx

Cette documentation décrit le backend présent dans ce dépôt : structure, dépendances, endpoints API, flux internes, limites et recommandations de déploiement. Elle est rédigée en français.

**Aperçu**
- **Projet**: Backend API pour Link2Mpx (téléchargement/analyse multi-plateformes)
- **Entrypoint**: `server.js` ([server.js](server.js))
- **Routes principales**: `routes/analyze.js` ([routes/analyze.js](routes/analyze.js)), `routes/download.js` ([routes/download.js](routes/download.js))
- **Utilitaire yt-dlp**: `utils/ytdlp.js` ([utils/ytdlp.js](utils/ytdlp.js))

**Prérequis**
- `Node.js` >= 18
- `npm` ou `yarn`
- Binaire `yt-dlp` installé et accessible dans le PATH du serveur
- (Optionnel) Accès à un stockage externe (S3, R2) pour héberger les fichiers téléchargés en production

**Installation & démarrage**
1. Installer les dépendances:

```bash
npm install
```

2. Variables d'environnement (exemples dans `.env`):
- `PORT` — port d'écoute (défaut `3001`)
- `FRONTEND_URL` — origine autorisée pour CORS (défaut `*`)
- `NODE_ENV` — `development` ou `production`

3. Démarrer l'API:

```bash
npm run start
# ou en dev
npm run dev
```

**Scripts utiles**
- `start`: `node server.js`
- `dev`: `nodemon server.js`
- `vercel-build`: script placeholder pour Vercel

**Sécurité et middleware**
- `helmet` pour en-têtes HTTP sécurisés
- `cors` configuré avec `FRONTEND_URL`
- `express-rate-limit` appliqué sur `/api/` (100 requêtes / 15 minutes par IP)
- Middleware de logging simple (console)

**Endpoints API**

**1) Health check**
- Méthode: `GET`
- Route: `/`
- Description: retourne un objet JSON avec le statut, version et endpoints exposés

Exemple de réponse:

```json
{
  "status": "ok",
  "message": "Link2Mpx API Backend",
  "version": "1.0.0",
  "endpoints": { "analyze": "GET /api/analyze?url=VIDEO_URL", "download": "POST /api/download {url, format, userId?}" }
}
```

**2) Analyser une vidéo**
- Méthode: `GET`
- Route: `/api/analyze`
- Query params:
  - `url` (string, requis) — URL de la vidéo à analyser
- Fonction: appelle `analyzeVideo(url)` dans `utils/ytdlp.js` pour récupérer les métadonnées et formats

Succès (200):
```json
{
  "success": true,
  "data": {
    "title": "...",
    "thumbnail": "...",
    "duration": 123,
    "platform": "YouTube",
    "uploader": "...",
    "viewCount": 12345,
    "formats": [ { "quality": "720p", "format": "mp4", "formatId": "137+140", "fileSize": "..." }, ... ]
  }
}
```

Erreurs courantes:
- `400` — `Paramètre "url" manquant` ou `URL invalide` ou `Plateforme non supportée`
- `500` — erreurs internes (ex: `yt-dlp` indisponible, timeout)

Exemple `curl`:

```bash
curl -G "http://localhost:3001/api/analyze" --data-urlencode "url=https://www.youtube.com/watch?v=XXXXX"
```

**3) Télécharger une vidéo**
- Méthode: `POST`
- Route: `/api/download`
- Body (JSON):
  - `url` (string, requis)
  - `format` (string, requis) — `formatId` renvoyé par l'analyse (ex: `137+140`, `bestaudio`)
  - `userId` (string, optionnel)

Succès (200):
```json
{
  "success": true,
  "downloadUrl": "/tmp/link2mpx_user_161234567890.mp4",
  "expiresAt": 1712345678901,
  "message": "Téléchargement prêt"
}
```

Erreurs courantes:
- `400` — `Paramètre "url" manquant` ou `Paramètre "format" manquant` ou `URL invalide`
- `500` — échec du téléchargement ou erreurs internes

Exemple `curl`:

```bash
curl -X POST http://localhost:3001/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=XXXXX","format":"bestaudio","userId":"user123"}'
```

**Comportement interne (résumé)**
- `analyzeVideo(url)`:
  - Exécute `yt-dlp --dump-json --no-playlist "url"` via `child_process.exec` (30s timeout)
  - Parse le JSON retourné et construit une liste de `formats` (qualités vidéo+audio et option `mp3` audio)
  - Retourne un objet `{ success: true, data: { ... } }`
  - Gestion d'erreurs: messages spécifiques pour vidéo privée, absence de `yt-dlp` ou timeout

- `downloadVideo(url, formatId, userId)`:
  - Génère un `outputPath` dans `/tmp` (ex: `/tmp/link2mpx_user_...`)
  - Si `formatId === 'bestaudio'` : commande `yt-dlp -f bestaudio --extract-audio --audio-format mp3 ...`
  - Sinon : `yt-dlp -f <formatId>+bestaudio --merge-output-format mp4 -o "<output>.%(ext)s" "<url>"`
  - Timeout de 5 minutes pour le téléchargement
  - Retourne actuellement un `downloadUrl` local (chemin `/tmp`) — note: non adapté à la production

**Limitations & recommandations (production)**
- `yt-dlp` doit être installé sur l'instance. Sur des plateformes serverless (Vercel) cela posera problème.
- Ne pas servir directement les fichiers depuis `/tmp` en production. Processus recommandé :
  1. Télécharger localement
  2. Uploader vers un stockage externe (S3, Cloudflare R2)
  3. Générer une URL signée (temporaire)
  4. Supprimer le fichier local après upload
- Prévoir gestion asynchrone / queue pour les téléchargements lourds (RabbitMQ, Bull, SQS)
- Limiter la taille des fichiers et le temps CPU pour éviter l'abus

**Déploiement**
- Docker recommandé pour inclure `yt-dlp` et ses dépendances dans l'image.
  - Exemple Dockerfile minimal : installer `yt-dlp` (pip ou binaire), Node 18, copier le code, npm install, exposer `PORT`.
- Vercel: le projet contient un `vercel.json`, mais Vercel n'est pas adapté pour exécuter `yt-dlp` lourdement (limites d'exécution et filesystem éphémère).

**Observabilité & logs**
- Logs console pour requêtes et erreurs (tail -f sur process manager en prod)
- Ajouter un système de logs structurés (p. ex. `winston`) et un monitoring (Sentry, Datadog)

**Tests & debug**
- Tester localement que `yt-dlp` fonctionne:

```bash
yt-dlp --version
yt-dlp --dump-json "https://www.youtube.com/watch?v=XXXXX"
```

- Si `analyze` retourne `yt-dlp n'est pas installé`, vérifier le PATH et permissions.

**Fichiers importants**
- `server.js` — point d'entrée et configuration middleware ([server.js](server.js))
- `routes/analyze.js` — endpoint d'analyse ([routes/analyze.js](routes/analyze.js))
- `routes/download.js` — endpoint de téléchargement ([routes/download.js](routes/download.js))
- `utils/ytdlp.js` — fonctions `analyzeVideo`, `downloadVideo`, `detectPlatform` ([utils/ytdlp.js](utils/ytdlp.js))
- `package.json` — dépendances et scripts ([package.json](package.json))

**Améliorations suggérées**
- Remplacer le `exec` synchrone promisifié par une gestion de process plus robuste (streams, suivi de progression)
- Utiliser une file d'attente pour les téléchargements et un worker dédié
- Intégrer upload vers S3/R2 et génération d'URLs signées
- Meilleure gestion des erreurs et codes HTTP détaillés
- Tests unitaires pour `utils/ytdlp.js` (mock de `exec`)

**Contact / Auteur**
- Auteur: KPRO.tech (voir `package.json`)

---

Pour toute modification ou ajout (exemples, intégration CDN, Dockerfile), veux-tu que je génère un `Dockerfile` exemple ou un guide de déploiement Docker ?
