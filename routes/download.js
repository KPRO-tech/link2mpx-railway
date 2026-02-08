const express = require('express');
const router = express.Router();
const { downloadVideo } = require('../utils/ytdlp');

/**
 * POST /api/download
 * Body: { url: string, format: string, userId?: string }
 * Télécharge une vidéo avec le format spécifié
 */
router.post('/', async (req, res) => {
  try {
    const { url, format, userId } = req.body;

    // Validation
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "url" manquant'
      });
    }

    if (!format) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "format" manquant'
      });
    }

    // Validation URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'URL invalide'
      });
    }

    console.log(`⬇️  Téléchargement demandé : ${url} (format: ${format}, user: ${userId || 'anonymous'})`);

    // Téléchargement avec yt-dlp
    const result = await downloadVideo(url, format, userId);

    // IMPORTANT : Dans un vrai système, il faudrait :
    // 1. Uploader le fichier sur un CDN (AWS S3, Cloudflare R2, etc.)
    // 2. Générer une URL signée temporaire (expire après 1h)
    // 3. Supprimer le fichier local après upload
    // 4. Retourner l'URL signée au client

    // Pour l'instant on retourne juste le path local (ne marchera pas en production)
    res.json({
      success: true,
      downloadUrl: result.downloadUrl,
      expiresAt: Date.now() + 3600000, // 1h
      message: 'Téléchargement prêt'
    });

  } catch (error) {
    console.error('Erreur route /download:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du téléchargement'
    });
  }
});

module.exports = router;
