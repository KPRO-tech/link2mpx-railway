# 🎬 Link2Mpx Backend API

Backend API pour Link2Mpx - Service de téléchargement de vidéos multi-plateformes.

## 🚀 Déploiement sur Railway (RECOMMANDÉ)

## 📋 Prérequis

- Node.js 18+
- yt-dlp installé sur le système
- npm ou yarn

## 🚀 Installation locale

```bash
# Cloner le repo
git clone <votre-repo>
cd link2mpx-backend

# Installer les dépendances
npm install

# Installer yt-dlp (Ubuntu/Debian)
sudo apt update
sudo apt install yt-dlp

# Ou avec pip
pip install yt-dlp

# Ou avec Homebrew (macOS)
brew install yt-dlp

# Créer le fichier .env
cp .env.example .env

# Modifier les variables d'environnement
nano .env

# Démarrer en mode dev
npm run dev
```

## 🌐 API Endpoints

### GET /api/analyze

Analyse une vidéo et retourne ses informations.

**Query params:**
- `url` (string, required) - URL de la vidéo

**Exemple:**
```bash
curl "http://localhost:3001/api/analyze?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Titre de la vidéo",
    "thumbnail": "https://...",
    "duration": 212,
    "platform": "YouTube",
    "uploader": "Nom du channel",
    "viewCount": 123456,
    "formats": [
      {
        "quality": "1080p",
        "format": "mp4",
        "formatId": "137",
        "fileSize": "45.23 MB",
        "fps": 30
      },
      {
        "quality": "Audio",
        "format": "mp3",
        "formatId": "bestaudio",
        "fileSize": "Variable"
      }
    ]
  }
}
```

### POST /api/download

Télécharge une vidéo avec le format spécifié.

**Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "format": "137",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://...",
  "expiresAt": 1234567890,
  "message": "Téléchargement prêt"
}
```

## 📦 Plateformes supportées

- ✅ YouTube
- ✅ TikTok
- ✅ Instagram
- ✅ Twitter/X
- ✅ Facebook

## 🔒 Sécurité

- Rate limiting : 100 requêtes / 15 minutes par IP
- CORS configuré pour frontend autorisé uniquement
- Helmet.js pour headers de sécurité
- Validation des URLs
- Timeouts sur les requêtes yt-dlp

## 🚀 Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Configurer les variables d'environnement sur Vercel dashboard
# FRONTEND_URL=https://votre-frontend.vercel.app
# NODE_ENV=production
```

**IMPORTANT:** Vercel a des limitations :
- Temps d'exécution max : 10s (Hobby) / 60s (Pro)
- Taille /tmp limitée à 512 MB
- Pas de stockage persistant

**Solutions recommandées:**
1. Utiliser Railway, Render ou Fly.io pour héberger le backend (meilleur pour les processus longs)
2. Implémenter un système de queue pour les téléchargements
3. Uploader les fichiers sur un CDN (S3, Cloudflare R2) et retourner l'URL

## ⚠️ Limitations actuelles

- Les fichiers téléchargés sont stockés dans `/tmp` (temporaire)
- Pas d'upload sur CDN implémenté
- Les URLs de téléchargement sont locales (ne marchent pas en production)

**TODO pour production:**
1. Implémenter upload vers S3/R2
2. Générer des URLs signées avec expiration
3. Nettoyer les fichiers temporaires
4. Ajouter un système de queue (Bull, BullMQ)
5. Monitorer les performances (Sentry, New Relic)

## 📄 Licence

MIT License - Voir LICENSE

## 👨‍💻 Auteur

BY [KPRO.tech](https://kpro.tech)
