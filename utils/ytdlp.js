const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Détecte la plateforme de la vidéo depuis l'URL
 */
function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
  return 'Inconnu';
}

/**
 * Analyse une vidéo avec yt-dlp et retourne les infos
 */
async function analyzeVideo(url) {
  try {
    // Commande yt-dlp pour récupérer les infos JSON
    const command = `yt-dlp --dump-json --no-playlist "${url}"`;
    
    const { stdout, stderr } = await execPromise(command, {
      timeout: 30000 // 30 secondes max
    });

    if (stderr && !stderr.includes('WARNING')) {
      console.error('yt-dlp stderr:', stderr);
    }

    const videoInfo = JSON.parse(stdout);
    
    // Extraction des formats disponibles
    const formats = [];
    
    // Formats vidéo avec audio
    if (videoInfo.formats) {
      const videoFormats = videoInfo.formats.filter(f => 
        f.vcodec !== 'none' && f.acodec !== 'none' && f.height
      );
      
      // Regrouper par qualité unique
      const qualityMap = new Map();
      
      videoFormats.forEach(format => {
        const quality = `${format.height}p`;
        if (!qualityMap.has(quality) || format.filesize > (qualityMap.get(quality).filesize || 0)) {
          qualityMap.set(quality, {
            quality: quality,
            format: format.ext || 'mp4',
            formatId: format.format_id,
            fileSize: format.filesize ? `${(format.filesize / 1024 / 1024).toFixed(2)} MB` : 'N/A',
            fps: format.fps || 30
          });
        }
      });
      
      formats.push(...Array.from(qualityMap.values()).sort((a, b) => 
        parseInt(b.quality) - parseInt(a.quality)
      ));
    }
    
    // Ajouter format audio MP3
    formats.push({
      quality: 'Audio',
      format: 'mp3',
      formatId: 'bestaudio',
      fileSize: 'Variable',
      fps: null
    });

    return {
      success: true,
      data: {
        title: videoInfo.title || 'Sans titre',
        thumbnail: videoInfo.thumbnail || '',
        duration: videoInfo.duration || 0,
        platform: detectPlatform(url),
        uploader: videoInfo.uploader || 'Inconnu',
        viewCount: videoInfo.view_count || 0,
        formats: formats
      }
    };

  } catch (error) {
    console.error('Erreur analyse yt-dlp:', error);
    
    // Messages d'erreur spécifiques
    if (error.message.includes('Video unavailable')) {
      throw new Error('Vidéo indisponible ou privée');
    }
    if (error.message.includes('not found')) {
      throw new Error('yt-dlp n\'est pas installé sur le serveur');
    }
    if (error.killed) {
      throw new Error('Temps d\'analyse dépassé');
    }
    
    throw new Error('Impossible d\'analyser cette vidéo');
  }
}

/**
 * Télécharge une vidéo avec yt-dlp et retourne l'URL du fichier
 */
async function downloadVideo(url, formatId = 'best', userId = 'anonymous') {
  try {
    const timestamp = Date.now();
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '');
    const outputPath = `/tmp/link2mpx_${sanitizedUserId}_${timestamp}`;
    
    let command;
    
    if (formatId === 'bestaudio') {
      // Téléchargement audio MP3
      command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${outputPath}.%(ext)s" "${url}"`;
    } else {
      // Téléchargement vidéo avec format spécifique
      command = `yt-dlp -f ${formatId}+bestaudio --merge-output-format mp4 -o "${outputPath}.%(ext)s" "${url}"`;
    }
    
    console.log('Commande de téléchargement:', command);
    
    const { stdout, stderr } = await execPromise(command, {
      timeout: 300000 // 5 minutes max
    });
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('yt-dlp download stderr:', stderr);
    }
    
    // Le fichier est dans /tmp, on devrait normalement l'uploader sur un CDN
    // Pour l'instant on retourne juste le path local
    // ATTENTION : Sur Vercel, /tmp est temporaire et limité
    
    return {
      success: true,
      downloadUrl: `${outputPath}.mp4`, // À remplacer par une vraie URL après upload
      filePath: outputPath,
      message: 'Vidéo téléchargée avec succès'
    };

  } catch (error) {
    console.error('Erreur téléchargement yt-dlp:', error);
    throw new Error('Échec du téléchargement');
  }
}

module.exports = {
  analyzeVideo,
  downloadVideo,
  detectPlatform
};
