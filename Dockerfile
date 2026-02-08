# Dockerfile pour Link2Mpx Backend
# Optimisé pour Railway avec yt-dlp et ffmpeg

FROM node:18-slim

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Installer yt-dlp (version la plus récente)
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

# Vérifier que yt-dlp est bien installé
RUN yt-dlp --version

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm ci --only=production

# Copier tout le code source
COPY . .

# Créer le dossier /tmp pour les téléchargements temporaires
RUN mkdir -p /tmp/downloads

# Exposer le port (Railway détecte automatiquement)
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001

# Commande de démarrage
CMD ["npm", "start"]
