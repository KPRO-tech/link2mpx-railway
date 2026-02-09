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

    if (!result.success) {
      return res.status(500).json(result);
    }

    const filePath = result.downloadUrl; // Le chemin local /tmp/...

    // IMPORTANT : On renvoie le fichier directement au client
    // Le serveur va lire le fichier dans /tmp et l'envoyer en stream au navigateur
    res.download(filePath, (err) => {
      if (err) {
        console.error("Erreur lors de l'envoi du fichier:", err);
        if (!res.headersSent) {
          res.status(500).send("Erreur lors du téléchargement");
        }
      }

      // Nettoyage : Supprimer le fichier après l'envoi pour ne pas remplir le disque
      try {
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error("Erreur suppression fichier temp:", e);
      }
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
