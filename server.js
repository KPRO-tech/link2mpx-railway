require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const analyzeRoute = require('./routes/analyze');
const downloadRoute = require('./routes/download');

const app = express();
const PORT = process.env.PORT || 3001;

// ═══════════════════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════════════════

// Sécurité
app.use(helmet());

// CORS - Autoriser uniquement ton frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - Prévenir les abus
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requêtes par IP
  message: { error: 'Trop de requêtes, réessayez plus tard' }
});
app.use('/api/', limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Link2Mpx API Backend',
    version: '1.0.0',
    endpoints: {
      analyze: 'GET /api/analyze?url=VIDEO_URL',
      download: 'POST /api/download {url, format, userId?}'
    }
  });
});

// Routes principales
app.use('/api/analyze', analyzeRoute);
app.use('/api/download', downloadRoute);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ═══════════════════════════════════════════════════════════
// DÉMARRAGE DU SERVEUR
// ═══════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`🚀 Backend Link2Mpx démarré sur le port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS autorisé pour: ${corsOptions.origin}`);
});

module.exports = app;
