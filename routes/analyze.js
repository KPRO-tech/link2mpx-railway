const express = require('express');
const router = express.Router();
const { analyzeVideo } = require('../utils/ytdlp');

/**
 * GET /api/analyze?url=VIDEO_URL
 * Analyse une vidéo et retourne ses informations et formats disponibles
 */
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    // Validation de l'URL
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "url" manquant'
      });
    }

    // Validation format URL
    let videoUrl;
    try {
      videoUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'URL invalide'
      });
    }

    // Vérifier que c'est une plateforme supportée
    const supportedDomains = [
      'youtube.com', 'youtu.be',
      'tiktok.com',
      'instagram.com',
      'twitter.com', 'x.com',
      'facebook.com', 'fb.watch'
    ];

    const isSupported = supportedDomains.some(domain => 
      videoUrl.hostname.includes(domain)
    );

    if (!isSupported) {
      return res.status(400).json({
        success: false,
        error: 'Plateforme non supportée. Plateformes disponibles : YouTube, TikTok, Instagram, Twitter/X, Facebook'
      });
    }

    console.log(`📊 Analyse de la vidéo : ${url}`);

    // Analyse avec yt-dlp
    const result = await analyzeVideo(url);

    res.json(result);

  } catch (error) {
    console.error('Erreur route /analyze:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'analyse de la vidéo'
    });
  }
});

module.exports = router;
